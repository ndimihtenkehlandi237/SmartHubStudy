const User = require('../models/User');
const axios = require('axios');

const NOTCHPAY_KEY = process.env.NOTCHPAY_PUBLIC_KEY;
const NOTCHPAY_BASE = 'https://api.notchpay.co';

// ── INITIALISE PAYMENT ──
const initiatePayment = async (req, res) => {
  try {
    const { phone, network, plan } = req.body;
    const user = await User.findById(req.user.id);

    if (!phone || !network || !plan) {
      return res.status(400).json({ message: 'Phone, network and plan are required' });
    }

    const amount = plan === 'yearly' ? 18000 : 2000;
    const description = `Smart Hub Study ${plan === 'yearly' ? 'Yearly' : 'Monthly'} Pro Plan`;

    // Step 1 — Initialise payment and get reference
    const initResponse = await axios.post(
      `${NOTCHPAY_BASE}/payments/initialize`,
      {
        amount,
        currency: 'XAF',
        email: user.email,
        phone: phone.startsWith('+237') ? phone : `+237${phone}`,
        description,
        reference: `smarthub_${user._id}_${Date.now()}`,
        callback: `${process.env.BACKEND_URL || 'https://smarthubstudy-1.onrender.com'}/api/payment/callback`,
      },
      {
        headers: {
          Authorization: NOTCHPAY_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const { reference } = initResponse.data.transaction;

    // Step 2 — Process with Mobile Money
    const channel = network === 'mtn' ? 'cm.mtn' : 'cm.orange';

    const processResponse = await axios.post(
      `${NOTCHPAY_BASE}/payments/${reference}`,
      {
        channel,
        data: {
          phone: phone.startsWith('+237') ? phone : `+237${phone}`,
        },
      },
      {
        headers: {
          Authorization: NOTCHPAY_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    // Save reference to user for verification later
    await User.findByIdAndUpdate(req.user.id, {
      pendingPaymentRef: reference,
      pendingPlan: plan,
    });

    console.log(`Payment initiated: ${reference} for user ${user.email}`);

    return res.status(200).json({
      message: 'Payment prompt sent to your phone. Approve it to activate Pro.',
      reference,
      status: processResponse.data.transaction?.status || 'pending',
    });

  } catch (error) {
    console.error('Payment initiation error:', error.response?.data || error.message);
    const msg = error.response?.data?.message || 'Payment failed. Please try again.';
    return res.status(500).json({ message: msg });
  }
};

// ── VERIFY PAYMENT STATUS ──
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `${NOTCHPAY_BASE}/payments/${reference}`,
      {
        headers: {
          Authorization: NOTCHPAY_KEY,
          Accept: 'application/json',
        },
      }
    );

    const transaction = response.data.transaction;
    const status = transaction?.status;

    if (status === 'complete') {
      const user = await User.findById(req.user.id);
      const plan = user.pendingPlan || 'monthly';

      const expiry = new Date();
      if (plan === 'yearly') {
        expiry.setFullYear(expiry.getFullYear() + 1);
      } else {
        expiry.setMonth(expiry.getMonth() + 1);
      }

      await User.findByIdAndUpdate(req.user.id, {
        plan: 'pro',
        proExpiry: expiry,
        pendingPaymentRef: null,
        pendingPlan: null,
      });

      console.log(`Payment verified. User ${req.user.id} upgraded to Pro`);
      return res.status(200).json({
        message: 'Payment successful! Your account is now Pro.',
        status: 'complete',
        plan,
      });
    }

    if (status === 'failed' || status === 'canceled') {
      return res.status(200).json({
        message: 'Payment was not successful. Please try again.',
        status,
      });
    }

    return res.status(200).json({
      message: 'Payment is still pending. Please approve on your phone.',
      status: status || 'pending',
    });

  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Could not verify payment. Please try again.' });
  }
};

// ── NOTCH PAY WEBHOOK CALLBACK ──
const paymentCallback = async (req, res) => {
  try {
    const { reference, status } = req.body;

    if (status === 'complete' && reference) {
      const user = await User.findOne({ pendingPaymentRef: reference });
      if (user) {
        const plan = user.pendingPlan || 'monthly';
        const expiry = new Date();
        if (plan === 'yearly') {
          expiry.setFullYear(expiry.getFullYear() + 1);
        } else {
          expiry.setMonth(expiry.getMonth() + 1);
        }
        await User.findByIdAndUpdate(user._id, {
          plan: 'pro',
          proExpiry: expiry,
          pendingPaymentRef: null,
          pendingPlan: null,
        });
        console.log(`Webhook: User ${user.email} upgraded to Pro via ${reference}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(200).json({ received: true });
  }
};

// ── GET PAYMENT STATUS ──
const getPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({
      plan: user.plan,
      proExpiry: user.proExpiry || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get payment status' });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  paymentCallback,
  getPaymentStatus,
};