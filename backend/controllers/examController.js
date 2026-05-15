const ExamCountdown = require('../models/ExamCountdown');

// CREATE EXAM
const createExam = async (req, res) => {
  try {
    const { examName, subjectId, examDate, notifyEnabled } = req.body;
    if (!examName || !examDate) {
      return res.status(400).json({ message: 'Exam name and date are required' });
    }
    const exam = await ExamCountdown.create({
      userId: req.user.id,
      examName,
      subjectId: subjectId || null,
      examDate,
      notifyEnabled: notifyEnabled !== undefined ? notifyEnabled : true,
    });
    res.status(201).json({ message: 'Exam added!', exam });
  } catch (error) {
    console.error('Create exam error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL EXAMS
const getExams = async (req, res) => {
  try {
    const exams = await ExamCountdown.find({ userId: req.user.id })
      .populate('subjectId', 'name')
      .sort({ examDate: 1 });
    res.status(200).json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE EXAM
const deleteExam = async (req, res) => {
  try {
    await ExamCountdown.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(200).json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createExam, getExams, deleteExam };