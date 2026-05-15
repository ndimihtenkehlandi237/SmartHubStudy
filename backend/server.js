const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const quizRoutes = require('./routes/quizRoutes');
const examRoutes = require('./routes/examRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/exams', examRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Hub Study API is running!' });
});

app.get('/test-env', (req, res) => {
  res.json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    openAIStart: process.env.OPENAI_API_KEY?.slice(0, 7),
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully!');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.log('MongoDB connection error:', error));