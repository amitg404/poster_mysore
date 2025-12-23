const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/checkout', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);

module.exports = router;
