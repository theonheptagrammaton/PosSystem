const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middlewares/authMiddleware');

// Middleware to bypass auth for QR menu calls if needed, 
// but we can also handle it in the controller by checking req.user or body
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        return authenticateToken(req, res, next);
    }
    next();
};

router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/', optionalAuth, notificationController.createNotification);
router.put('/:id/status', authenticateToken, notificationController.updateStatus);

module.exports = router;
