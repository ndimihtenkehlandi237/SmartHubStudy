const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  initiatePayment,
  verifyPayment,
  paymentCallback,
  getPaymentStatus,
} = require('../controllers/paymentController');

// Public webhook — no auth needed
router.post('/callback', paymentCallback);

// Protected routes
router.post('/initiate', protect, initiatePayment);
router.get('/verify/:reference', protect, verifyPayment);
router.get('/status', protect, getPaymentStatus);

module.exports = router;