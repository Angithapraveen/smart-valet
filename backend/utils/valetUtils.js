const pool = require('../config/database');

/**
 * Generate Valet Ticket ID
 */
const generateValetId = async (locationId) => {
    const locationQuery = 'SELECT location_short_code FROM LOCATIONS WHERE location_id = $1';
    const locResult = await pool.query(locationQuery, [locationId]);

    if (locResult.rows.length === 0) {
        throw new Error('Location not found');
    }

    const shortCode = (locResult.rows[0].location_short_code || 'VAL').toUpperCase();
    const today = new Date();
    const yy = today.getFullYear().toString().slice(-2);
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearSearchPrefix = `${shortCode}-${yy}`;

    const query = `
        SELECT valet_id FROM VALET_TRANSACTIONS 
        WHERE location_id = $1 AND valet_id LIKE $2
        ORDER BY created_at DESC, valet_id DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [locationId, `${yearSearchPrefix}%`]);

    let nextNum = 1;
    if (result.rows.length > 0) {
        const lastId = result.rows[0].valet_id;
        const lastNumStr = lastId.slice(-3);
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const zzz = nextNum.toString().padStart(3, '0');
    return `${shortCode}-${yy}${mm}${zzz}`;
};

/**
 * Get Next Available Key Slot (Sequence 1 to Capacity)
 */
const getNextAvailableKeySlot = async (client, locationId) => {
    // We use the client passed (could be pool or txn client)
    const query = `
        SELECT id FROM generate_series(1, (SELECT COALESCE(total_capacity, 100) FROM LOCATIONS WHERE location_id = $1)) AS id
        EXCEPT
        SELECT key_slot FROM VALET_TRANSACTIONS WHERE location_id = $1 AND status NOT IN ('RETURNED', 'CANCELLED')
        ORDER BY id ASC LIMIT 1
    `;
    const result = await client.query(query, [locationId]);
    if (result.rows.length === 0) {
        throw new Error('No available key slots at this location. (Capacity reached)');
    }
    return result.rows[0].id;
};

module.exports = {
    generateValetId,
    getNextAvailableKeySlot
};
