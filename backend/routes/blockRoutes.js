const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, attachLocationAccess } = require('../middleware/roleAccess');
const { createBlock, getBlocksWithEntries, updateBlock } = require('../controllers/blockController');

// Middlewares for authentication and data attachment
router.use(authenticate);
router.use(attachLocationAccess);

router.get('/locations/:locationId/blocks', requireRole('OWNER', 'MANAGER'), getBlocksWithEntries);
router.post('/locations/:locationId/blocks', requireRole('OWNER', 'MANAGER'), createBlock);
router.put('/blocks/:blockId', requireRole('OWNER', 'MANAGER'), updateBlock);

module.exports = router;
