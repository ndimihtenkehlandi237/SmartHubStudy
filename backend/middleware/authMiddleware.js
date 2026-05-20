const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── PROTECT ROUTE ──
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Not authorized. Please login.'
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized. Invalid token.'
    });
  }
};

// ── CHECK FREE PLAN LIMITS (5 uploads per 6 hours) ──
const checkFreeLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Pro users have no limits
    if (user.plan === 'pro') {
      return next();
    }

    const Note = require('../models/Note');

    // Check uploads in last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentUploads = await Note.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: sixHoursAgo }
    });

    const FREE_UPLOAD_LIMIT = 5;

    if (recentUploads >= FREE_UPLOAD_LIMIT) {
      // Calculate time remaining
      const oldestRecent = await Note.findOne({
        userId: req.user.id,
        createdAt: { $gte: sixHoursAgo }
      }).sort({ createdAt: 1 });

      let hoursLeft = 6;
      if (oldestRecent) {
        const resetTime = new Date(
          oldestRecent.createdAt.getTime() + 6 * 60 * 60 * 1000
        );
        const msLeft = resetTime - Date.now();
        hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
      }

      return res.status(403).json({
        message: `Free plan limit reached. You can upload 5 notes every 6 hours. Please wait ${hoursLeft} hour(s) or upgrade to Pro for unlimited uploads.`,
        code: 'FREE_LIMIT_REACHED',
        limit: FREE_UPLOAD_LIMIT,
        current: recentUploads,
        hoursLeft,
      });
    }

    next();
  } catch (error) {
    console.error('checkFreeLimit error:', error.message);
    next();
  }
};

// ── PRO ONLY FEATURES ──
const proOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.plan !== 'pro') {
      return res.status(403).json({
        message: 'This feature is for Pro subscribers only. Upgrade to Pro to unlock.',
        code: 'PRO_REQUIRED',
      });
    }
    next();
  } catch (error) {
    console.error('proOnly error:', error.message);
    next();
  }
};

module.exports = { protect, checkFreeLimit, proOnly };