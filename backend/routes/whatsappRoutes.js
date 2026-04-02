const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Verification (GET)
router.get('/', whatsappController.verifyWebhook);

// Message Handling (POST)
router.post('/', whatsappController.handleWebhook);

module.exports = router;
