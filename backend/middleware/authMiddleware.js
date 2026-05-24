const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache for user plan checks (5 minute TTL)
const planCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCachedUser = async userId => {
  const cached = planCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  const user = await User.findById(userId).select('plan extraUploads extraQuizzes').lean();
  if (user) {
    planCache.set(userId, { user, timestamp: Date.now() });
  }
  return user;
};

// ── PROTECT ROUTE — Verify JWT ──
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized. Please login.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user to request
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    return res.status(401).json({ message: 'Not authorized.' });
  }
};

// ── CHECK FREE PLAN LIMITS (5 uploads per 6 hours) ──
const checkFreeLimit = async (req, res, next) => {
  try {
    const user = await getCachedUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Pro users or users with extra uploads bypass limit
    if (user.plan === 'pro') return next();

    const Note = require('../models/Note');
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const recentUploads = await Note.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: sixHoursAgo },
    });

    const FREE_UPLOAD_LIMIT = 5;

    // Check if user has extra upload tokens
    if (recentUploads >= FREE_UPLOAD_LIMIT) {
      if (user.extraUploads > 0) {
        // Consume an extra upload token
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { extraUploads: -1 },
        });
        // Clear cache
        planCache.delete(req.user.id);
        return next();
      }

      const oldestRecent = await Note.findOne({
        userId: req.user.id,
        createdAt: { $gte: sixHoursAgo },
      }).sort({ createdAt: 1 }).lean();

      let hoursLeft = 6;
      if (oldestRecent) {
        const resetTime = new Date(
          oldestRecent.createdAt.getTime() + 6 * 60 * 60 * 1000
        );
        hoursLeft = Math.max(1, Math.ceil((resetTime - Date.now()) / (1000 * 60 * 60)));
      }

      return res.status(403).json({
        message: `Free plan limit reached. You can upload 5 notes every 6 hours. Wait ${hoursLeft} hour(s) or upgrade to Pro.`,
        code: 'FREE_LIMIT_REACHED',
        limit: FREE_UPLOAD_LIMIT,
        current: recentUploads,
        hoursLeft,
      });
    }

    next();
  } catch (error) {
    console.error('checkFreeLimit error:', error.message);
    next(); // Don't block on middleware errors
  }
};

// ── PRO ONLY FEATURES ──
const proOnly = async (req, res, next) => {
  try {
    const user = await getCachedUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.plan !== 'pro') {
      return res.status(403).json({
        message: 'This feature is for Pro subscribers only.',
        code: 'PRO_REQUIRED',
      });
    }
    next();
  } catch (error) {
    console.error('proOnly error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, checkFreeLimit, proOnly };