const pool = require('../config/database');

/**
 * Generate Block ID
 * Format: LOC-B##
 * Example: MCV-B01, MCV-B02
 */
const generateBlockId = async (locationId) => {
    // Get location short code
    const locationQuery = 'SELECT location_short_code FROM LOCATIONS WHERE location_id = $1';
    const locationResult = await pool.query(locationQuery, [locationId]);

    if (locationResult.rows.length === 0) {
        throw new Error('Location not found');
    }

    const locationShortCode = locationResult.rows[0].location_short_code;

    // Get last block number for this location
    const blockQuery = `
        SELECT block_id 
        FROM BLOCKS 
        WHERE location_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
    `;
    const blockResult = await pool.query(blockQuery, [locationId]);

    let nextNumber = 1;

    if (blockResult.rows.length > 0) {
        const lastBlockId = blockResult.rows[0].block_id;
        // Extract number from format: LOC-B##
        const match = lastBlockId.match(/-B(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    const blockNumber = String(nextNumber).padStart(2, '0');
    return `${locationShortCode}-B${blockNumber}`;
};

/**
 * Generate Block Entry ID
 * Format: BLOCKID-###
 * Example: MCV-B01-001, MCV-B01-002
 */
const generateBlockEntryId = (blockId, serialNumber) => {
    const serial = String(serialNumber).padStart(3, '0');
    return `${blockId}-${serial}`;
};

module.exports = {
    generateBlockId,
    generateBlockEntryId
};
