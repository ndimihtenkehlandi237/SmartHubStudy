const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: ['http://localhost:3000', 'https://smart-hub-study.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authRoutes        = require('./routes/authRoutes');
const noteRoutes        = require('./routes/noteRoutes');
const quizRoutes        = require('./routes/quizRoutes');
const examRoutes        = require('./routes/examRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const studyGroupRoutes  = require('./routes/studyGroupRoutes');
const paymentRoutes     = require('./routes/paymentRoutes');
const competitionRoutes = require('./routes/competitionRoutes');

app.use('/api/auth',        authRoutes);
app.use('/api/notes',       noteRoutes);
app.use('/api/quiz',        quizRoutes);
app.use('/api/exams',       examRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/groups',      studyGroupRoutes);
app.use('/api/payment',     paymentRoutes);
app.use('/api/competition', competitionRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Hub Study API is running!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('MongoDB Connected Successfully!');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB error:', err.message);
    process.exit(1);
  });