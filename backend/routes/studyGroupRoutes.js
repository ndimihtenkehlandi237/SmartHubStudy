const express = require('express');
const router = express.Router();
const {
  createGroup,
  joinGroup,
  getMyGroups,
  shareNote,
  saveSharedNote,
  sendMessage,
  getMessages,
  leaveGroup,
  deleteGroup,
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);
router.get('/my', protect, getMyGroups);
router.post('/:id/share', protect, shareNote);
router.post('/:id/save-note', protect, saveSharedNote);
router.post('/:id/messages', protect, sendMessage);
router.get('/:id/messages', protect, getMessages);
router.delete('/:id/leave', protect, leaveGroup);
router.delete('/:id', protect, deleteGroup);

module.exports = router;