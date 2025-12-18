const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middlewares/authMiddleware');

// Public/POS routes (might need auth adjustment, but for now assuming authenticated or mixed)
router.post('/', orderController.createOrder);

// Aggregation Routes
router.get('/table/:tenantId/:branchId/:tableNo', orderController.getTableOrders);
router.post('/table/:tenantId/:branchId/:tableNo/pay', orderController.closeTable);
router.delete('/table/:tenantId/:branchId/:tableNo/item/:productId', orderController.removeItem);
router.get('/status/:tenantId/:branchId', orderController.getBranchStatus);

// Authenticated History Route (Dashboard)
router.get('/', authenticateToken, orderController.getAllOrders);

module.exports = router;
