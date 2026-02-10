const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, attachLocationAccess } = require('../middleware/roleAccess');
const {
    getAdminDashboard,
    getOwnerDashboard,
    getManagerDashboard
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(authenticate);
router.use(attachLocationAccess);

// Admin Dashboard
router.get('/admin', requireRole('ADMIN'), getAdminDashboard);

// Owner Dashboard
router.get('/owner', requireRole('OWNER'), getOwnerDashboard);

// Manager Dashboard
router.get('/manager', requireRole('MANAGER'), getManagerDashboard);

module.exports = router;
