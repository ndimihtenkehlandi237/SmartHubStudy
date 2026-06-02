const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ExamCountdown = require('../models/ExamCountdown');

// GET all exams for current user
router.get('/', protect, async (req, res) => {
  try {
    const exams = await ExamCountdown.find({ userId: req.user.id })
      .sort({ date: 1 })
      .lean();
    return res.status(200).json({ exams });
  } catch (error) {
    console.error('Get exams error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

// CREATE exam
router.post('/', protect, async (req, res) => {
  try {
    const { name, date, subject, notes } = req.body;

    console.log('Creating exam:', { name, date, subject, userId: req.user.id });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Exam name is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Exam date is required' });
    }

    const examDate = new Date(date);
    if (isNaN(examDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const exam = await ExamCountdown.create({
      userId: req.user.id,
      name: name.trim(),
      date: examDate,
      subject: subject ? subject.trim() : '',
      notes: notes ? notes.trim() : '',
    });

    console.log('Exam created successfully:', exam._id);

    return res.status(201).json({
      message: 'Exam added successfully!',
      exam,
    });
  } catch (error) {
    console.error('Create exam error:', error.message);
    return res.status(500).json({ message: error.message || 'Failed to add exam' });
  }
});

// DELETE exam
router.delete('/:id', protect, async (req, res) => {
  try {
    const exam = await ExamCountdown.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error.message);
    return res.status(500).json({ message: 'Failed to delete exam' });
  }
});

module.exports = router;