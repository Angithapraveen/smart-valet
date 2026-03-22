const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAccess');
const { updateUserStatus, updateUserDetails, getAllUsers } = require('../controllers/ownerController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/', getAllUsers);
router.put('/:userId/status', updateUserStatus);
router.put('/:userId', updateUserDetails);

module.exports = router;
