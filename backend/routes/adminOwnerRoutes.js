const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAccess');
const {
    createOwner,
    getOwners
} = require('../controllers/ownerController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/', createOwner);
router.get('/', getOwners);

module.exports = router;
