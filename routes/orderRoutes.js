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
router.get('/pending/:tenantId/:branchId', orderController.getPendingOrders);
router.post('/approve/:orderId', orderController.approveOrder);
router.post('/reject/:orderId', orderController.rejectOrder);
router.post('/ready/:orderId', orderController.markOrderReady);

// Authenticated History Route (Dashboard)
router.get('/', authenticateToken, orderController.getAllOrders);

module.exports = router;
