const express = require('express');
const router = express.Router();
const {
  uploadNote, getNotes, getNote, getNotesBySubject,
  deleteNote, createSubject, getSubjects, deleteSubject
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Subject routes MUST come first
router.post('/subjects', protect, createSubject);
router.get('/subjects', protect, getSubjects);
router.delete('/subjects/:id', protect, deleteSubject);
router.get('/subject/:subjectId', protect, getNotesBySubject);

// Note routes
router.post('/upload', protect, upload.single('file'), uploadNote);
router.get('/', protect, getNotes);
router.get('/:id', protect, getNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;