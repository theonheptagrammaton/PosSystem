const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateToken = require('../middlewares/authMiddleware');

// Public/POS routes (might need auth adjustment, but for now assuming authenticated or mixed)
router.post('/', orderController.createOrder);

// Aggregation Routes
router.get('/table/:tenantId/:tableNo', orderController.getTableOrders);
router.post('/table/:tenantId/:tableNo/pay', orderController.closeTable);
router.delete('/table/:tenantId/:tableNo/item/:productId', orderController.removeItem);
router.get('/status/:tenantId', orderController.getBranchStatus);

// Authenticated History Route (Dashboard)
router.get('/', authenticateToken, orderController.getAllOrders);

module.exports = router;
