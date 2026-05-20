const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const FAPSHI_API_USER = process.env.FAPSHI_API_USER;
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY;
const FAPSHI_BASE_URL = 'https://live.fapshi.com';

// ── INITIATE PAYMENT (MTN or Orange via Fapshi) ──
router.post('/initiate', protect, async (req, res) => {
  try {
    const { phone, plan, method } = req.body;

    if (!phone || !plan || !method) {
      return res.status(400).json({
        message: 'Phone number, plan, and payment method are required'
      });
    }

    if (phone.length < 9) {
      return res.status(400).json({
        message: 'Please enter a valid 9-digit phone number'
      });
    }

    const amount = plan === 'monthly' ? 2000 : 18000;
    const planName = plan === 'monthly' ? 'Monthly Pro Plan' : 'Yearly Pro Plan';

    // Check if Fapshi is configured
    if (!FAPSHI_API_USER || !FAPSHI_API_KEY ||
      FAPSHI_API_USER === 'your_fapshi_api_user') {

      // Simulate payment for demo purposes
      const simulatedBalance = Math.random() > 0.3
        ? amount + 1000
        : amount - 500;

      if (simulatedBalance < amount) {
        return res.status(400).json({
          message: `Insufficient balance. You need ${amount.toLocaleString()} FCFA to subscribe to the ${planName}. Please top up your ${method === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} account and try again.`,
          code: 'INSUFFICIENT_BALANCE',
          method,
          amount,
        });
      }

      return res.status(200).json({
        message: `Payment request of ${amount.toLocaleString()} FCFA sent to +237${phone}. Check your phone and approve the ${method === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} request.`,
        transId: `DEMO_${Date.now()}`,
        status: 'pending',
        amount,
        phone,
        plan,
        method,
      });
    }

    // Real Fapshi payment
    try {
      const response = await axios.post(
        `${FAPSHI_BASE_URL}/initiate-pay`,
        {
          amount,
          phone: `237${phone}`,
          message: `Smart Hub Study - ${planName}`,
          userId: req.user.id,
        },
        {
          headers: {
            'apiuser': FAPSHI_API_USER,
            'apikey': FAPSHI_API_KEY,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Fapshi response:', response.data);

      res.status(200).json({
        message: `Payment request of ${amount.toLocaleString()} FCFA sent to +237${phone}. Check your phone and approve the payment request.`,
        transId: response.data.transId,
        link: response.data.link,
        status: 'pending',
        amount,
        phone,
        plan,
        method,
      });

    } catch (fapshiError) {
      console.error('Fapshi error:', fapshiError.response?.data);

      const fapshiMessage = fapshiError.response?.data?.message || '';

      if (fapshiMessage.toLowerCase().includes('balance') ||
        fapshiMessage.toLowerCase().includes('insufficient')) {
        return res.status(400).json({
          message: `Insufficient balance. You need ${amount.toLocaleString()} FCFA. Please top up your ${method === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} account and try again.`,
          code: 'INSUFFICIENT_BALANCE',
          method,
          amount,
        });
      }

      return res.status(400).json({
        message: fapshiMessage || 'Payment initiation failed. Please try again.',
        code: 'PAYMENT_FAILED',
      });
    }

  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ message: 'Payment failed. Please try again.' });
  }
});

// ── VERIFY PAYMENT STATUS ──
router.get('/verify/:transId', protect, async (req, res) => {
  try {
    const { transId } = req.params;

    // Demo transaction
    if (transId.startsWith('DEMO_')) {
      await User.findByIdAndUpdate(req.user.id, { plan: 'pro' });
      return res.status(200).json({
        message: 'Payment confirmed! Account upgraded to Pro.',
        status: 'successful',
        plan: 'pro',
      });
    }

    // Real Fapshi verification
    const response = await axios.get(
      `${FAPSHI_BASE_URL}/payment-status/${transId}`,
      {
        headers: {
          'apiuser': FAPSHI_API_USER,
          'apikey': FAPSHI_API_KEY,
        }
      }
    );

    const { status } = response.data;
    console.log('Payment status:', status, 'for transId:', transId);

    if (status === 'SUCCESSFUL') {
      await User.findByIdAndUpdate(req.user.id, { plan: 'pro' });
      return res.status(200).json({
        message: 'Payment confirmed! Your account has been upgraded to Pro.',
        status: 'successful',
        plan: 'pro',
      });
    }

    if (status === 'FAILED') {
      return res.status(400).json({
        message: 'Payment failed. Please try again.',
        status: 'failed',
      });
    }

    res.status(200).json({
      message: 'Payment is still pending. Please approve on your phone.',
      status: 'pending',
    });

  } catch (error) {
    console.error('Verify error:', error.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

module.exports = router;