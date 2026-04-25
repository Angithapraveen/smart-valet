const pool = require('../config/database');
const { validateIndianPlate } = require('../utils/plateValidation');
const { generateValetId, getNextAvailableKeySlot } = require('../utils/valetUtils');
const whatsappService = require('../services/whatsappService');
const subscriptionService = require('../services/subscriptionService');

/**
 * Handle WhatsApp Transaction
 * POST /api/valet/whatsapp
 * Expects: { location_id, driver_id }
 * (In a real scenario, this would parse a webhook payload)
 */
const createWhatsAppTransaction = async (req, res) => {
    const { location_id, driver_id, customer_name, phone_number, car_model, car_number } = req.body;

    if (!location_id || !driver_id) {
        return res.status(400).json({
            success: false,
            message: 'Location ID and Driver ID are required.'
        });
    }

    try {
        // Check Subscription Limit
        const subCheck = await subscriptionService.checkParkingLimit(location_id);
        req.subscription_id = subCheck.subscription_id; // Store for later use
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message || 'Subscription check failed.'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Generate ID, Key Slot and Create Transaction ALWAYS
        const valetId = await generateValetId(location_id);
        const { slot: keySlot, isOverCapacity } = await getNextAvailableKeySlot(client, location_id);

        const insertQuery = `
            INSERT INTO VALET_TRANSACTIONS 
            (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_model, car_number, status, parked_time, key_slot)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'PARKED', NOW(), $8)
            RETURNING *
        `;
        const values = [
            valetId,         // $1
            location_id,     // $2
            driver_id,       // $3
            customer_name || 'WhatsApp Guest', // $4
            phone_number || 'N/A', // $5
            car_model || 'Unknown', // $6
            car_number || null, // $7
            keySlot || 1     // $8 (Fallback to 1)
        ];
        
        console.log(`[Manual-Transaction] Final Slot to store: ${keySlot || 1} for Valet: ${valetId}`);
        const txnResult = await client.query(insertQuery, values);
        if (!txnResult.rows[0].key_slot) {
            console.error('[Manual-Transaction-Error] KEY_SLOT STILL NULL IN DB AFTER INSERT!');
        }
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

        // Decrement Subscription Usage
        if (req.subscription_id) {
            await subscriptionService.decrementUsage(req.subscription_id);
        }

        await client.query('COMMIT');

        // 3. Send WhatsApp Confirmation (Non-blocking)
        if (phone_number && phone_number !== 'N/A') {
            try {
                const locRes = await pool.query('SELECT location_name FROM LOCATIONS WHERE location_id = $1', [location_id]);
                const locationName = locRes.rows[0]?.location_name || 'Our Location';
                
                // Allow some time for background processes if needed, but here it's fine
                whatsappService.sendParkingConfirmation(phone_number, valetId, locationName).catch(err => {
                    console.error('[WhatsApp-Error] Failed to send parking confirmation:', err);
                });

            } catch (err) {
                console.error('[WhatsApp-Error] Error fetching location for confirmation:', err);
            }
        }

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

        const [txnResult, locResult] = await Promise.all([
            pool.query(query, [location_id]),
            pool.query('SELECT total_capacity, location_name FROM LOCATIONS WHERE location_id = $1', [location_id])
        ]);

        res.json({
            success: true,
            data: txnResult.rows,
            location: locResult.rows[0] || null
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
    const { brand, model, tier, car_number } = req.body;

    try {
        // Validation and Normalization
        let normalizedPlate = car_number;
        if (car_number && car_number !== 'N/A') {
            normalizedPlate = car_number.replace(/\s+/g, '').toUpperCase();
            
            const validation = validateIndianPlate(normalizedPlate);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }
        }

        // Fallback Logic
        const getTier = (b, m, t) => {
            if (t) return t;
            const bb = b?.toUpperCase() || '';
            const mm = m?.toUpperCase() || '';
            const luxury = ['BMW', 'AUDI', 'MERCEDES-BENZ', 'VOLVO', 'BYD'];
            if (luxury.some(l => bb.includes(l))) return 'Premium';
            if (mm.includes('SUV')) return 'High';
            if (mm.includes('HATCHBACK')) return 'Low';
            return 'Medium';
        };

        const finalTier = getTier(brand, model, tier);
        const finalModel = brand && model ? `${brand} ${model}` : (brand || model || 'Unknown');

        const result = await pool.query(
            `UPDATE VALET_TRANSACTIONS
             SET car_model = $1,
                 category_tier = $2,
                 car_number = $3
             WHERE valet_id = $4
             RETURNING *`,
            [finalModel, finalTier, normalizedPlate, valetId]
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
    const { block_id, car_number } = req.body;

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
        let updateQuery = '';
        let params = [];
        
        if (car_number) {
            updateQuery = `
                UPDATE VALET_TRANSACTIONS 
                SET block_entry_id = $1, car_number = $3
                WHERE valet_id = $2
                RETURNING *
            `;
            params = [blockEntryId, valetId, car_number];
        } else {
            updateQuery = `
                UPDATE VALET_TRANSACTIONS 
                SET block_entry_id = $1
                WHERE valet_id = $2
                RETURNING *
            `;
            params = [blockEntryId, valetId];
        }
        
        const updateResult = await client.query(updateQuery, params);

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

        // WhatsApp Notification
        const txn = result.rows[0];
        if (txn.phone_number && txn.phone_number !== 'N/A') {
            await whatsappService.sendMessage(txn.phone_number, `Valet ID: ${valetId}\nYour car is being prepared. Our driver is on the way.`);
        }

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

    if (!['ON_THE_WAY', 'READY', 'RETURNED', 'PARKED'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Allowed: ON_THE_WAY, READY, RETURNED, PARKED'
        });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkQuery = `SELECT status, location_id, block_entry_id, returned_driver_id FROM VALET_TRANSACTIONS WHERE valet_id = $1 FOR UPDATE`;
            const checkResult = await client.query(checkQuery, [valetId]);

            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Transaction not found.' });
            }

            const txnData = checkResult.rows[0];
            const currentStatus = txnData.status;
            const locationId = txnData.location_id;
            const blockEntryId = txnData.block_entry_id;
            const assignedDriverId = txnData.returned_driver_id;
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
            let isOverCapacity = false;
            let newKeySlotValue = null;

            // If we're moving OUT of parked (bringing car back), free the slot
            if (['ON_THE_WAY', 'READY', 'RETURNED'].includes(status) && blockEntryId) {
                await client.query(
                    "UPDATE BLOCK_ENTRIES SET status = 'AVAILABLE' WHERE block_entry_id = $1",
                    [blockEntryId]
                );
            }

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
                updateQuery = `
                    UPDATE VALET_TRANSACTIONS 
                    SET status = 'RETURNED', returned_time = NOW()
                    WHERE valet_id = $1
                    RETURNING *
                `;
                params = [valetId];
            } else if (status === 'PARKED') {
                // Return car to PARKED status (Repark)
                // 1. Get a NEW available key slot
                const res = await getNextAvailableKeySlot(client, locationId);
                newKeySlotValue = res.slot;
                isOverCapacity = res.isOverCapacity;
                
                // 2. Clear block assignment if any (it might be in a different spot now)
                if (blockEntryId) {
                    await client.query(
                        "UPDATE BLOCK_ENTRIES SET status = 'AVAILABLE' WHERE block_entry_id = $1",
                        [blockEntryId]
                    );
                }

                updateQuery = `
                    UPDATE VALET_TRANSACTIONS 
                    SET status = 'PARKED', 
                        return_requested_time = NULL,
                        on_the_way_time = NULL,
                        ready_time = NULL,
                        returned_driver_id = NULL,
                        key_slot = $2,
                        block_entry_id = NULL
                    WHERE valet_id = $1
                    RETURNING *
                `;
                params = [valetId, newKeySlotValue];
            }

            const result = await client.query(updateQuery, params);

            await client.query('COMMIT');

            // Send WhatsApp Notification (Non-blocking)
            const updatedTxn = result.rows[0];
            if (updatedTxn.phone_number && updatedTxn.phone_number !== 'N/A') {
                const locRes = await pool.query('SELECT location_name FROM LOCATIONS WHERE location_id = $1', [locationId]);
                const locationName = locRes.rows[0]?.location_name || 'Our Location';

                if (status === 'ON_THE_WAY') {
                    const msg = `🚀 *On the way!* Our driver is bringing your car for ${valetId}.\n\nPlease wait at the pickup area.🏎️💨`;
                    whatsappService.sendMessage(updatedTxn.phone_number, msg).catch(err => console.error('WS MSG Error:', err));
                } else if (status === 'READY') {
                    const msg = `📍 *Your car is Ready!* \nValet ID: ${valetId} is waiting at the exit.\n\n😊Kindly proceed to the pickup area within the next 5 minutes.\nIf you are unable to arrive within this time, your vehicle will be safely reparked for your convenience🚗💨`;
                    whatsappService.sendMessage(updatedTxn.phone_number, msg).catch(err => console.error('WS MSG Error:', err));
                } else if (status === 'RETURNED') {
                    // Trigger interactive feedback buttons instead of plain text
                    whatsappService.sendFeedbackButtons(updatedTxn.phone_number, valetId).catch(err => console.error('WS MSG Error:', err));
                } else if (status === 'PARKED') {
                    const msg = `💤 *Car Reparked:* Since you weren't able to arrive in time, your car (${valetId}) has been safely reparked. \n\nWhenever you are ready, just request your car again! 🚗🔄`;
                    
                    
                    whatsappService.sendMessage(updatedTxn.phone_number, msg).catch(err => console.error('WS MSG Error:', err));
                }
            }

            res.json({
                success: true,
                message: `Status updated to ${status}`,
                data: {
                    ...result.rows[0],
                    isOverCapacity,
                    newKeySlot: newKeySlotValue
                }
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
            SELECT vt.*, 
                   up.name as parked_driver_name,
                   ur.name as returned_driver_name 
            FROM VALET_TRANSACTIONS vt
            LEFT JOIN USERS up ON vt.parked_driver_id = up.user_id
            LEFT JOIN USERS ur ON vt.returned_driver_id = ur.user_id
            WHERE vt.location_id = $1 
            ${dateCondition.replace(/created_at/g, 'vt.created_at')}
            ORDER BY vt.created_at DESC
        `;

        const result = await pool.query(query, params);

        // Fetch all drivers associated with this location to ensure they show in performance report
        const driversQuery = `
            SELECT u.user_id, u.name, u.phone_number, u.status
            FROM USERS u
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE la.location_id = $1 AND rm.role_name = 'DRIVER' AND u.status = TRUE
        `;
        const driversResult = await pool.query(driversQuery, [location_id]);

        res.json({
            success: true,
            data: result.rows,
            drivers: driversResult.rows,
            count: result.rowCount
        });

    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transaction history.' });
    }
};

module.exports = {
    generateValetId,
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