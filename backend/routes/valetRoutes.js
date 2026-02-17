const express = require('express');
const router = express.Router();
const valetController = require('../controllers/valetController');
const { authenticate } = require('../middleware/auth');

// Protected route for simulation/manual testing
// In a real webhook scenario, this might use signature verification instead of JWT
router.post('/whatsapp', authenticate, valetController.createWhatsAppTransaction);
router.get('/vehicles', authenticate, valetController.getValetVehicles);
router.get('/:valetId', authenticate, valetController.getValetTransactionDetails);
router.put('/:valetId', authenticate, valetController.updateVehicleDetails);

module.exports = router;
