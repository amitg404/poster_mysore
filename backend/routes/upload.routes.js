const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

router.post('/', uploadController.uploadMiddleware, uploadController.uploadImage);

module.exports = router;
