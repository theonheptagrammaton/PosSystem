const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

// Route: PUT /api/users/onboard
router.put('/onboard', authenticateToken, userController.onboardUser);

module.exports = router;
