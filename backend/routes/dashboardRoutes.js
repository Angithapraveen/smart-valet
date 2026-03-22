const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, attachLocationAccess } = require('../middleware/roleAccess');
const {
    getAdminDashboard,
    getOwnerDashboard,
    getManagerDashboard
} = require('../controllers/dashboardController');
const {
    getDashboardSummary,
    getLocationUsers
} = require('../controllers/adminDashboardController');
const {
    getOwnerSummary,
    getOwnerLocations,
    getOwnerLocationUsers,
    getOwnerLocationBlocks,
    getOwnerLocationDetails,
    getOwnerLocationActiveParking
} = require('../controllers/ownerDashboardController');

// All dashboard routes require authentication
router.use(authenticate);
router.use(attachLocationAccess);

// Admin Dashboard
router.get('/admin/summary', requireRole('ADMIN'), getDashboardSummary);
router.get('/admin/locations/:id/users', requireRole('ADMIN'), getLocationUsers);
router.get('/admin', requireRole('ADMIN'), getAdminDashboard);

// Owner Dashboard
router.get('/owner/summary', requireRole('OWNER'), getOwnerSummary);
router.get('/owner/locations', requireRole('OWNER'), getOwnerLocations);
router.get('/owner/location/:id', requireRole('OWNER'), getOwnerLocationDetails); // Singular as per spec
router.get('/owner/locations/:id/users', requireRole('OWNER', 'MANAGER'), getOwnerLocationUsers);
router.get('/owner/locations/:id/blocks', requireRole('OWNER', 'MANAGER'), getOwnerLocationBlocks); // Keeping plural for existing
router.get('/owner/location/:id/blocks', requireRole('OWNER', 'MANAGER'), getOwnerLocationBlocks); // Alias for spec consistency
router.get('/owner/location/:id/active-parking', requireRole('OWNER', 'MANAGER'), getOwnerLocationActiveParking);
router.get('/owner/location/:id/users', requireRole('OWNER', 'MANAGER'), getOwnerLocationUsers); // Alias for spec consistency
router.get('/owner', requireRole('OWNER'), getOwnerDashboard);

// Manager Dashboard
router.get('/manager', requireRole('MANAGER'), getManagerDashboard);

module.exports = router;
