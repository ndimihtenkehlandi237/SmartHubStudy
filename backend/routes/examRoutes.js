const express = require('express');
const router = express.Router();
const { createExam, getExams, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createExam);
router.get('/', protect, getExams);
router.delete('/:id', protect, deleteExam);

module.exports = router;