const express = require('express');
const router = express.Router();
const { solveMath } = require('../controllers/aiController');
const { protect, proOnly } = require('../middleware/authMiddleware');

// Math solver is Pro only
router.post('/solve-math', protect, proOnly, solveMath);

module.exports = router;