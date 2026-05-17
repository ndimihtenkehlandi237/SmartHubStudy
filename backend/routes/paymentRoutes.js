const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/mtn', protect, async (req, res) => {
  try {
    const { phone, plan } = req.body;
    if (!phone || !plan) {
      return res.status(400).json({ message: 'Phone and plan are required' });
    }
    console.log(`MTN payment initiated: ${phone} for ${plan}`);
    res.status(200).json({
      message: 'MTN Mobile Money payment request sent successfully!',
      phone,
      plan,
      status: 'pending',
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment failed' });
  }
});

router.post('/orange', protect, async (req, res) => {
  try {
    const { phone, plan } = req.body;
    if (!phone || !plan) {
      return res.status(400).json({ message: 'Phone and plan are required' });
    }
    console.log(`Orange Money payment initiated: ${phone} for ${plan}`);
    res.status(200).json({
      message: 'Orange Money payment request sent successfully!',
      phone,
      plan,
      status: 'pending',
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment failed' });
  }
});

module.exports = router;