const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/authMiddleware');

// Middleware to check for SUPER_ADMIN role
const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: Super Admin only' });
    }
};

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/stats', adminController.getGlobalStats);
router.get('/tenants', adminController.getAllTenants);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenantAdmin);
router.delete('/tenants/:id', adminController.deleteTenant);
router.get('/analytics', adminController.getSalesAnalytics);

module.exports = router;
