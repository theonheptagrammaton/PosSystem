const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateToken = require('../middlewares/authMiddleware');

// Protected Routes (Manager/Admin Only conceptually, but using basic auth for now)
router.get('/', authenticateToken, reportController.getReportData);

module.exports = router;
