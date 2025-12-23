const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/:itemId', protect, cartController.updateQuantity);
router.delete('/:itemId', protect, cartController.removeFromCart);

module.exports = router;
