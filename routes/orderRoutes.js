const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);

// Aggregation Routes
router.get('/table/:tenantId/:tableNo', orderController.getTableOrders);
router.post('/table/:tenantId/:tableNo/pay', orderController.closeTable);

module.exports = router;
