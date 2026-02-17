const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, attachLocationAccess } = require('../middleware/roleAccess');
const { createBlock, getBlocksWithEntries, updateBlock } = require('../controllers/blockController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(attachLocationAccess);
router.use(requireRole('ADMIN'));

// Admin block routes
router.get('/locations/:locationId/blocks', getBlocksWithEntries);
router.post('/', createBlock); // POST /api/admin/blocks
router.put('/:blockId', updateBlock); // PUT /api/admin/blocks/:blockId

module.exports = router;
