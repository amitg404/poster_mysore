const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.getAllProducts);
router.get('/previews', productController.getCategoryPreviews);
router.get('/:id', productController.getProductById);

module.exports = router;
