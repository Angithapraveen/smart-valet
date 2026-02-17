const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAccess');
const {
    createLocation,
    getLocations,
    updateLocationStatus,
    getLocationOwners
} = require('../controllers/locationController');
const { createManager } = require('../controllers/ownerActionsController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/', createLocation);
router.get('/', getLocations);
router.put('/:id/status', updateLocationStatus);
router.get('/:id/owners', getLocationOwners);
router.post('/:location_id/manager', createManager);

module.exports = router;
