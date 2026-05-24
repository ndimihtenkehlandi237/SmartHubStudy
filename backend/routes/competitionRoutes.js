const express = require('express');
const router = express.Router();
const {
  getCurrentCompetition,
  joinCompetition,
  getLeaderboard,
  processRewards,
  getTokenBalance,
} = require('../controllers/competitionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/current', protect, getCurrentCompetition);
router.post('/join', protect, joinCompetition);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/process-rewards', protect, processRewards);
router.get('/tokens', protect, getTokenBalance);

module.exports = router;