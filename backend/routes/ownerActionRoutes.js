const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, attachLocationAccess } = require('../middleware/roleAccess');
const {
    createManager,
    createDriver,
    updateMemberStatus,
    updateMemberDetails
} = require('../controllers/ownerActionsController');

// Middlewares for authentication and data attachment
router.use(authenticate);
router.use(attachLocationAccess);

// Routes with specific role requirements
router.post('/location/:location_id/manager', requireRole('OWNER', 'ADMIN'), createManager);
router.post('/location/:location_id/driver', requireRole('OWNER', 'MANAGER', 'ADMIN'), createDriver);
router.put('/user/:userId/status', requireRole('OWNER', 'MANAGER', 'ADMIN'), updateMemberStatus);
router.put('/user/:userId', requireRole('OWNER', 'MANAGER', 'ADMIN'), updateMemberDetails);

module.exports = router;
