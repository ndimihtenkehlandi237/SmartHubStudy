const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadNote,
  getNotes,
  getNote,
  deleteNote,
  getSubjects,
  createSubject,
} = require('../controllers/noteController');

// Use memory storage instead of disk — works on Render
const storage = multer.memoryStorage();

const fileFilter = function (req, file, cb) {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (allowed.includes(file.mimetype) || file.originalname.endsWith('.docx')) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Subject routes
router.get('/subjects', protect, getSubjects);
router.post('/subjects', protect, createSubject);

// Note routes
router.post('/upload', protect, upload.single('file'), uploadNote);
router.get('/', protect, getNotes);
router.get('/:id', protect, getNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;