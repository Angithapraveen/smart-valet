const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAccess');
const {
    createLocation,
    getLocations,
    updateLocationStatus
} = require('../controllers/locationController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/', createLocation);
router.get('/', getLocations);
router.put('/:id/status', updateLocationStatus);

module.exports = router;
