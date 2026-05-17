const express = require('express');
const router = express.Router();
const {
  createGroup, joinGroup, getMyGroups,
  shareNote, leaveGroup, deleteGroup
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);
router.get('/my', protect, getMyGroups);
router.post('/:id/share', protect, shareNote);
router.delete('/:id/leave', protect, leaveGroup);
router.delete('/:id', protect, deleteGroup);

module.exports = router;