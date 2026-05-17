const express = require('express');
const router = express.Router();
const { solveMath } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/solve-math', protect, solveMath);

module.exports = router;