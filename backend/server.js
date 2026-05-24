const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const quizRoutes = require('./routes/quizRoutes');
const examRoutes = require('./routes/examRoutes');
const aiRoutes = require('./routes/aiRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const competitionRoutes = require('./routes/competitionRoutes');

const app = express();

// ── SECURITY: Helmet adds 15+ HTTP security headers ──
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for React compatibility
  crossOriginEmbedderPolicy: false,
}));

// ── SECURITY: Allowed frontend origins only ──
const allowedOrigins = [
  'http://localhost:3000',
  'https://smart-hub-study.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

// ── SECURITY: Rate limiting — prevents brute force attacks ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per 15 minutes per IP
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 login attempts per 15 minutes
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(globalLimiter);

// ── PERFORMANCE: Parse limits prevent large payload attacks ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── LOGGING: Only in development ──
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // In production only log errors
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  }));
}

// ── ROUTES ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/groups', studyGroupRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/competition', competitionRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ message: 'Smart Hub Study API is running! 🚀' });
});

// ── SECURITY: Global error handler — never expose stack traces ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  // Never send stack traces to client in production
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── PERFORMANCE: MongoDB connection with optimized settings ──
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Timeout after 5s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch(error => {
    console.log('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });