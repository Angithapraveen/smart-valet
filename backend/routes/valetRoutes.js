const express = require('express');
const router = express.Router();
const valetController = require('../controllers/valetController');
const { authenticate } = require('../middleware/auth');

// Protected route for simulation/manual testing
// In a real webhook scenario, this might use signature verification instead of JWT
router.post('/whatsapp', authenticate, valetController.createWhatsAppTransaction);
router.get('/vehicles', authenticate, valetController.getValetVehicles);
router.get('/history', authenticate, valetController.getTransactionHistory);
// Status Updates (Manager)
router.put('/status/:valetId', authenticate, valetController.updateTransactionStatus);

router.get('/blocks/active', authenticate, valetController.getValetBlocks);
router.post('/:valetId/assign-block', authenticate, valetController.assignBlock);

router.get('/:valetId', authenticate, valetController.getValetTransactionDetails);
router.put('/:valetId', authenticate, valetController.updateVehicleDetails);

// Public Routes (No Auth)
router.get('/status/:valetId', valetController.getPublicTransactionStatus);
router.post('/request-return/:valetId', valetController.requestVehicleReturn);

module.exports = router;
