const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliate.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/dashboard', protect, affiliateController.getDashboardStats);

module.exports = router;
