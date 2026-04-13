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
 * Get Next Available Key Slot (Sequence 1 to Capacity, allows exceed)
 */
const getNextAvailableKeySlot = async (client, locationId) => {
    // 1. Get current capacity
    const capQuery = 'SELECT COALESCE(total_capacity, 100) as capacity FROM LOCATIONS WHERE location_id = $1';
    const capRes = await client.query(capQuery, [locationId]);
    const capacity = parseInt(capRes.rows[0]?.capacity || 100);

    // 2. Try to find smallest gap within capacity
    const gapQuery = `
        SELECT id FROM generate_series(1, $1) AS id
        EXCEPT
        SELECT key_slot FROM VALET_TRANSACTIONS WHERE location_id = $2 AND status NOT IN ('RETURNED', 'CANCELLED')
        ORDER BY id ASC LIMIT 1
    `;
    const gapResult = await client.query(gapQuery, [capacity, locationId]);

    if (gapResult.rows.length > 0) {
        return { slot: gapResult.rows[0].id, isOverCapacity: false };
    }

    // 3. If no gap found within capacity, find absolute max active slot and return max + 1
    const maxQuery = `
        SELECT MAX(key_slot) as max_slot 
        FROM VALET_TRANSACTIONS 
        WHERE location_id = $1 AND status NOT IN ('RETURNED', 'CANCELLED')
    `;
    const maxResult = await client.query(maxQuery, [locationId]);
    const maxActiveSlot = parseInt(maxResult.rows[0]?.max_slot || capacity);
    
    return { slot: maxActiveSlot + 1, isOverCapacity: true };
};

module.exports = {
    generateValetId,
    getNextAvailableKeySlot
};
