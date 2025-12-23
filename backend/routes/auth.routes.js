const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
const { protect } = require('../middleware/auth.middleware');
router.get('/me', protect, authController.getMe);

module.exports = router;
