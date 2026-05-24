const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendSuggestions,
  getUserByShareLink,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/search', protect, searchUsers);
router.post('/friend-request/:userId', protect, sendFriendRequest);
router.post('/accept-friend/:userId', protect, acceptFriendRequest);
router.get('/suggestions', protect, getFriendSuggestions);
router.get('/share/:shareLink', getUserByShareLink);

module.exports = router;