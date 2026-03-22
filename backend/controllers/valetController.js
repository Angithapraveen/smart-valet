const pool = require('../config/database');

/**
 * Generate Valet Ticket ID
 * Format: XXX-YYMMZZZ
 * XXX: Location short code
 * YY: Year, MM: Month
 * ZZZ: Serial number (resets every year)
 */
const generateValetId = async (locationId) => {
    try {
        // 1. Fetch Location Short Code
        const locationQuery = 'SELECT location_short_code FROM LOCATIONS WHERE location_id = $1';
        const locResult = await pool.query(locationQuery, [locationId]);

        if (locResult.rows.length === 0) {
            throw new Error('Location not found');
        }

        const shortCode = (locResult.rows[0].location_short_code || 'VAL').toUpperCase();

        const today = new Date();
        const yy = today.getFullYear().toString().slice(-2);
        const mm = (today.getMonth() + 1).toString().padStart(2, '0');

        // Prefix for searching serial in current year at this location: XXX-YY
        const yearSearchPrefix = `${shortCode}-${yy}`;

        // Find latest ticket for this location and current year
        // We use created_at to be sure we are looking at recent ones, 
        // and filter by the ID prefix to correctly identify this year's serials
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
            // Format: XXX-YYMMZZZ
            // Serial is the last 3 digits
            const lastNumStr = lastId.slice(-3);
            const lastNum = parseInt(lastNumStr, 10);

            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        const zzz = nextNum.toString().padStart(3, '0');

        // Final format: XXX-YYMMZZZ
        return `${shortCode}-${yy}${mm}${zzz}`;
    } catch (error) {
        console.error('Error generating Valet ID:', error);
        throw error;
    }
};

/**
 * Handle WhatsApp Transaction
 * POST /api/valet/whatsapp
 * Expects: { location_id, driver_id }
 * (In a real scenario, this would parse a webhook payload)
 */
const createWhatsAppTransaction = async (req, res) => {
    const { location_id, driver_id, customer_name, phone_number, car_model } = req.body;

    if (!location_id || !driver_id) {
        return res.status(400).json({
            success: false,
            message: 'Location ID and Driver ID are required.'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Generate ID and Create Transaction ALWAYS
        const valetId = await generateValetId(location_id);
        const insertQuery = `
            INSERT INTO VALET_TRANSACTIONS 
            (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_model, status, parked_time)
            VALUES ($1, $2, $3, $4, $5, $6, 'PARKED', NOW())
            RETURNING *
        `;
        const values = [
            valetId,
            location_id,
            driver_id,
            customer_name || 'WhatsApp Guest',
            phone_number || 'N/A',
            car_model || 'Unknown'
        ];
        const txnResult = await client.query(insertQuery, values);
        let transaction = txnResult.rows[0];
        let blockAssigned = false;

        // 2. Check Blocks for Auto-Assignment
        const blocksResult = await client.query(
            'SELECT block_id FROM BLOCKS WHERE location_id = $1 AND status = TRUE AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)',
            [location_id]
        );

        // If exactly one block exists, auto-assign
        if (blocksResult.rows.length === 1) {
            const targetBlockId = blocksResult.rows[0].block_id;

            // Find First Available Slot
            const slotQuery = `
                SELECT block_entry_id 
                FROM BLOCK_ENTRIES 
                WHERE block_id = $1 AND status = 'AVAILABLE'
                ORDER BY block_entry_id ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            `;
            const slotResult = await client.query(slotQuery, [targetBlockId]);

            if (slotResult.rows.length > 0) {
                const blockEntryId = slotResult.rows[0].block_entry_id;

                // Update Slot Status
                await client.query(
                    "UPDATE BLOCK_ENTRIES SET status = 'OCCUPIED' WHERE block_entry_id = $1",
                    [blockEntryId]
                );

                // Update Transaction with Block Entry ID
                const updateTxn = await client.query(
                    "UPDATE VALET_TRANSACTIONS SET block_entry_id = $1 WHERE valet_id = $2 RETURNING *",
                    [blockEntryId, valetId]
                );
                transaction = updateTxn.rows[0];
                blockAssigned = true;
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            valet_id: valetId,
            message: blockAssigned ? 'Car parked and block assigned.' : 'Car parked. Waiting for block selection.',
            data: transaction,
            block_assigned: blockAssigned
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('WhatsApp Transaction Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get Valet Vehicles for Dashboard
 * GET /api/valet/vehicles?location_id=LOC-123
 */
const getValetVehicles = async (req, res) => {
    try {
        const { location_id } = req.query;

        if (!location_id) {
            return res.status(400).json({
                success: false,
                message: 'Location ID is required.'
            });
        }

        // Fetch vehicles that are currently active (PARKED, RETURN_REQUESTED, READY)
        // We might also want to show recently RETURNED ones, but for now focus on active
        const query = `
            SELECT * FROM VALET_TRANSACTIONS 
            WHERE location_id = $1 
            AND status IN ('PARKED', 'RETURN_REQUESTED', 'ON_THE_WAY', 'READY')
            ORDER BY 
                CASE status 
                    WHEN 'RETURN_REQUESTED' THEN 1 
                    WHEN 'ON_THE_WAY' THEN 2
                    WHEN 'READY' THEN 3 
                    WHEN 'PARKED' THEN 4 
                    ELSE 5 
                END,
                created_at DESC
        `;

        const result = await pool.query(query, [location_id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get Valet Vehicles Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles.'
        });
    }
};



/**
 * Get Single Valet Transaction Details
 * GET /api/valet/:valetId
 */
const getValetTransactionDetails = async (req, res) => {
    try {
        const { valetId } = req.params;

        const query = `
            SELECT * FROM VALET_TRANSACTIONS 
            WHERE valet_id = $1
        `;

        const result = await pool.query(query, [valetId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get Transaction Details Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction details.'
        });
    }
};

/**
 * Update Vehicle Details
 * PUT /api/valet/:valetId
 */
const updateVehicleDetails = async (req, res) => {
    const { valetId } = req.params;
    const { car_model, car_category } = req.body;

    try {
        const result = await pool.query(
            `UPDATE VALET_TRANSACTIONS
             SET car_model = $1,
                 car_category = $2
             WHERE valet_id = $3
             RETURNING *`,
            [car_model, car_category, valetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vehicle details updated successfully.'
        });

    } catch (err) {
        console.error('Update Vehicle Details Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle details.'
        });
    }
};

/**
 * Get Active Blocks for a Location
 * GET /api/valet/blocks?location_id=LOC-123
 */
const getValetBlocks = async (req, res) => {
    try {
        const { location_id } = req.query;

        if (!location_id) {
            return res.status(400).json({ success: false, message: 'Location ID is required.' });
        }

        const query = `
            SELECT 
                b.block_id, 
                b.block_name, 
                b.capacity,
                (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'AVAILABLE') as available_slots
            FROM BLOCKS b
            WHERE b.location_id = $1 AND b.status = TRUE 
            AND b.valid_from <= CURRENT_DATE AND (b.valid_to IS NULL OR b.valid_to >= CURRENT_DATE)
            ORDER BY b.block_name ASC
        `;

        const result = await pool.query(query, [location_id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get Valet Blocks Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blocks.' });
    }
};

/**
 * Assign Block to Existing Transaction
 * POST /api/valet/:valetId/assign-block
 */
const assignBlock = async (req, res) => {
    const { valetId } = req.params;
    const { block_id } = req.body;

    if (!block_id) {
        return res.status(400).json({ success: false, message: 'Block ID is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Find Transaction and check if already assigned
        const txnCheck = await client.query('SELECT block_entry_id FROM VALET_TRANSACTIONS WHERE valet_id = $1', [valetId]);
        if (txnCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if (txnCheck.rows[0].block_entry_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Block already assigned' });
        }

        // 2. Find Available Slot in Block
        const slotQuery = `
            SELECT block_entry_id 
            FROM BLOCK_ENTRIES 
            WHERE block_id = $1 AND status = 'AVAILABLE'
            ORDER BY block_entry_id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        `;
        const slotResult = await client.query(slotQuery, [block_id]);

        if (slotResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'No available slots in this block' });
        }

        const blockEntryId = slotResult.rows[0].block_entry_id;

        // 3. Update Slot
        await client.query(
            "UPDATE BLOCK_ENTRIES SET status = 'OCCUPIED' WHERE block_entry_id = $1",
            [blockEntryId]
        );

        // 4. Update Transaction
        const updateQuery = `
            UPDATE VALET_TRANSACTIONS 
            SET block_entry_id = $1
            WHERE valet_id = $2
            RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [blockEntryId, valetId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Block assigned successfully',
            data: updateResult.rows[0],
            slot_id: blockEntryId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Assign Block Error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};


/**
 * Public: Get Verification/Status Details
 * GET /api/valet/status/:valetId
 */
const getPublicTransactionStatus = async (req, res) => {
    try {
        const { valetId } = req.params;
        const query = `SELECT valet_id, customer_name, car_model, status FROM VALET_TRANSACTIONS WHERE valet_id = $1`;
        const result = await pool.query(query, [valetId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get Public Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

/**
 * Public: Request Vehicle Return
 * POST /api/valet/request-return/:valetId
 */
const requestVehicleReturn = async (req, res) => {
    try {
        const { valetId } = req.params;

        // Only allow if status is PARKED
        const checkQuery = `SELECT status FROM VALET_TRANSACTIONS WHERE valet_id = $1`;
        const checkResult = await pool.query(checkQuery, [valetId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        if (checkResult.rows[0].status !== 'PARKED') {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is not currently parked or return already requested.'
            });
        }

        const updateQuery = `
            UPDATE VALET_TRANSACTIONS 
            SET status = 'RETURN_REQUESTED', return_requested_time = NOW()
            WHERE valet_id = $1
            RETURNING *
        `;
        const result = await pool.query(updateQuery, [valetId]);

        res.json({
            success: true,
            message: 'Return request received.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Request Return Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

/**
 * Update Transaction Status (Manager Action)
 * PUT /api/valet/status/:valetId
 * Body: { status: 'READY' | 'RETURNED' }
 */
const updateTransactionStatus = async (req, res) => {
    const { valetId } = req.params;
    const { status } = req.body;

    if (!['ON_THE_WAY', 'READY', 'RETURNED'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Allowed: ON_THE_WAY, READY, RETURNED'
        });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkQuery = `SELECT status, block_entry_id, returned_driver_id FROM VALET_TRANSACTIONS WHERE valet_id = $1 FOR UPDATE`;
            const checkResult = await client.query(checkQuery, [valetId]);

            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Transaction not found.' });
            }

            const currentStatus = checkResult.rows[0].status;
            const blockEntryId = checkResult.rows[0].block_entry_id;
            const assignedDriverId = checkResult.rows[0].returned_driver_id;
            const currentUserId = req.user.user_id;

            // Enforcement: If already assigned, only THAT driver can progress
            if (assignedDriverId && assignedDriverId !== currentUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({
                    success: false,
                    message: 'This request has already been accepted by another driver.'
                });
            }

            // Logic for status updates
            let updateQuery = '';
            let params = [];

            if (status === 'ON_THE_WAY') {
                if (currentStatus !== 'RETURN_REQUESTED') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Can only start "On the way" if return was requested.' });
                }
                updateQuery = `
                    UPDATE VALET_TRANSACTIONS 
                    SET status = 'ON_THE_WAY', 
                        on_the_way_time = NOW(),
                        returned_driver_id = $2
                    WHERE valet_id = $1
                    RETURNING *
                `;
                params = [valetId, currentUserId];
            } else if (status === 'READY') {
                updateQuery = `
                    UPDATE VALET_TRANSACTIONS 
                    SET status = 'READY', ready_time = NOW()
                    WHERE valet_id = $1
                    RETURNING *
                `;
                params = [valetId];
            } else if (status === 'RETURNED') {
                // If returning, free up the slot if assigned
                if (blockEntryId) {
                    await client.query(
                        "UPDATE BLOCK_ENTRIES SET status = 'AVAILABLE' WHERE block_entry_id = $1",
                        [blockEntryId]
                    );
                }

                updateQuery = `
                    UPDATE VALET_TRANSACTIONS 
                    SET status = 'RETURNED', returned_time = NOW()
                    WHERE valet_id = $1
                    RETURNING *
                `;
                params = [valetId];
            }

            const result = await client.query(updateQuery, params);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: `Status updated to ${status}`,
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status.' });
    }
};

/**
 * Get Transaction History with Date Filters
 * GET /api/valet/history?location_id=LOC-123&filter=today|week|month
 */
const getTransactionHistory = async (req, res) => {
    try {
        const { location_id, filter, startDate, endDate } = req.query;

        if (!location_id) {
            return res.status(400).json({ success: false, message: 'Location ID is required.' });
        }

        let dateCondition = '';
        let params = [location_id];
        let paramIndex = 2;

        const now = new Date();
        // Reset time to end of day for cleaner comparisons if needed, but usually start of day is better for >=
        // For "Today", we want from 00:00:00 today.

        const getStartOfDay = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        const getEndOfDay = (d) => {
            const date = new Date(d);
            date.setHours(23, 59, 59, 999);
            return date;
        };

        if (filter === 'today') {
            const startStr = getStartOfDay(now).toISOString();
            dateCondition = `AND created_at >= $${paramIndex}`;
            params.push(startStr);
        } else if (filter === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const startStr = getStartOfDay(yesterday).toISOString();
            const endStr = getEndOfDay(yesterday).toISOString();
            dateCondition = `AND created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
            params.push(startStr, endStr);
        } else if (filter === 'week') {
            // Last 7 days
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const startStr = getStartOfDay(weekAgo).toISOString();
            dateCondition = `AND created_at >= $${paramIndex}`;
            params.push(startStr);
        } else if (filter === 'month') {
            // Last 30 days
            const monthAgo = new Date(now);
            monthAgo.setDate(monthAgo.getDate() - 30);
            const startStr = getStartOfDay(monthAgo).toISOString();
            dateCondition = `AND created_at >= $${paramIndex}`;
            params.push(startStr);
        } else if (filter === 'year') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            const startStr = getStartOfDay(yearAgo).toISOString();
            dateCondition = `AND created_at >= $${paramIndex}`;
            params.push(startStr);
        } else if (filter === 'custom' && startDate && endDate) {
            const startStr = getStartOfDay(startDate).toISOString();
            const endStr = getEndOfDay(endDate).toISOString();
            dateCondition = `AND created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
            params.push(startStr, endStr);
        } else {
            // Default to today if no valid filter provided? Or all? 
            // Let's default to today to avoid massive initial loads
            const startStr = getStartOfDay(now).toISOString();
            dateCondition = `AND created_at >= $${paramIndex}`;
            params.push(startStr);
        }

        const query = `
            SELECT * FROM VALET_TRANSACTIONS 
            WHERE location_id = $1 
            ${dateCondition}
            ORDER BY created_at DESC
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rowCount
        });

    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transaction history.' });
    }
};

module.exports = {
    createWhatsAppTransaction,
    getValetVehicles,
    getValetTransactionDetails,
    updateVehicleDetails,
    getValetBlocks,
    assignBlock,
    getPublicTransactionStatus,
    requestVehicleReturn,
    updateTransactionStatus,
    getTransactionHistory
};