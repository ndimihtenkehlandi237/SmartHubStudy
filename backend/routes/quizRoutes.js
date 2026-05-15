const express = require('express');
const router = express.Router();
const {
  generateQuiz, submitQuiz,
  getResults, getResult, getStats
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateQuiz);
router.post('/submit', protect, submitQuiz);
router.get('/results/stats', protect, getStats);
router.get('/results/:id', protect, getResult);
router.get('/results', protect, getResults);

module.exports = router;