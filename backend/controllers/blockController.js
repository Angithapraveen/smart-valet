const pool = require('../config/database');
const { generateBlockId, generateBlockEntryId } = require('../services/blockIdService');

/**
 * Create Block (Owner only)
 * Auto-generates block ID and creates all block entries
 */
const createBlock = async (req, res) => {
    try {
        const { block_name, capacity, valid_from, valid_to, location_id } = req.body;
        const locationId = req.params.locationId || location_id;
        const locationIds = req.locationIds || [];

        // Validate required fields
        if (!block_name || !capacity || !valid_from || !valid_to) {
            return res.status(400).json({
                success: false,
                message: 'Block name, capacity, and validity dates are required.'
            });
        }

        // Validate capacity
        if (capacity <= 0 || capacity > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Capacity must be between 1 and 1000.'
            });
        }

        // Validate dates
        const fromDate = new Date(valid_from);
        const toDate = new Date(valid_to);

        if (fromDate >= toDate) {
            return res.status(400).json({
                success: false,
                message: 'Valid From date must be before Valid To date.'
            });
        }

        // Verify owner has access to this location
        if (!locationIds.includes(locationId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        // Check if block name already exists for this location
        const duplicateCheck = await pool.query(
            'SELECT block_id FROM BLOCKS WHERE location_id = $1 AND block_name = $2',
            [locationId, block_name.trim()]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Block name already exists for this location.'
            });
        }

        // Generate Block ID
        const blockId = await generateBlockId(locationId);

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Insert block
            const blockQuery = `
                INSERT INTO BLOCKS (block_id, location_id, block_name, capacity, valid_from, valid_to, status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
                RETURNING *
            `;
            const blockResult = await pool.query(blockQuery, [
                blockId,
                locationId,
                block_name.trim(),
                capacity,
                valid_from,
                valid_to
            ]);
            const block = blockResult.rows[0];

            // Create block entries
            for (let i = 1; i <= capacity; i++) {
                const entryId = generateBlockEntryId(blockId, i);

                const entryQuery = `
                    INSERT INTO BLOCK_ENTRIES (block_entry_id, block_id, location_id, status, created_at)
                    VALUES ($1, $2, $3, 'AVAILABLE', NOW())
                `;
                await pool.query(entryQuery, [entryId, blockId, locationId]);
            }

            // Commit transaction
            await pool.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Block created successfully with all entries.',
                data: {
                    ...block,
                    entries_created: capacity
                }
            });

        } catch (error) {
            // Rollback on any error
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Create block error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create block.'
        });
    }
};

/**
 * Get Blocks with Entries for a Location (Owner only)
 */
const getBlocksWithEntries = async (req, res) => {
    try {
        const { locationId } = req.params;
        const locationIds = req.locationIds || [];

        // Verify owner has access to this location
        if (!locationIds.includes(locationId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        const query = `
            SELECT 
                b.block_id,
                b.block_name,
                b.capacity,
                b.valid_from,
                b.valid_to,
                (b.status AND b.valid_from <= CURRENT_DATE AND (b.valid_to IS NULL OR b.valid_to >= CURRENT_DATE)) as status,
                b.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'block_entry_id', be.block_entry_id,
                            'status', be.status
                        ) ORDER BY be.block_entry_id
                    ) FILTER (WHERE be.block_entry_id IS NOT NULL),
                    '[]'
                ) AS entries
            FROM BLOCKS b
            LEFT JOIN BLOCK_ENTRIES be ON b.block_id = be.block_id
            WHERE b.location_id = $1
            GROUP BY b.block_id
            ORDER BY b.created_at ASC
        `;

        const result = await pool.query(query, [locationId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get blocks with entries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blocks.'
        });
    }
};

/**
 * Update Block (Owner only)
 * Handles capacity changes intelligently
 */
const updateBlock = async (req, res) => {
    try {
        const { blockId } = req.params;
        const { block_name, capacity, valid_from, valid_to, status } = req.body;
        const locationIds = req.locationIds || [];

        // Validate required fields
        if (!block_name || !capacity || !valid_from || !valid_to || status === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // Validate capacity
        if (capacity <= 0 || capacity > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Capacity must be between 1 and 1000.'
            });
        }

        // Validate dates
        const fromDate = new Date(valid_from);
        const toDate = new Date(valid_to);

        if (fromDate >= toDate) {
            return res.status(400).json({
                success: false,
                message: 'Valid From date must be before Valid To date.'
            });
        }

        // Get existing block and verify access
        const blockQuery = 'SELECT * FROM BLOCKS WHERE block_id = $1';
        const blockResult = await pool.query(blockQuery, [blockId]);

        if (blockResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Block not found.'
            });
        }

        const existingBlock = blockResult.rows[0];

        // Verify owner has access to this block
        if (!locationIds.includes(existingBlock.location_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this block.'
            });
        }

        // Check if new name already exists for another block in the same location
        const duplicateCheck = await pool.query(
            'SELECT block_id FROM BLOCKS WHERE location_id = $1 AND block_name = $2 AND block_id != $3',
            [existingBlock.location_id, block_name.trim(), blockId]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Another block with this name already exists in this location.'
            });
        }

        const oldCapacity = existingBlock.capacity;
        const newCapacity = capacity;

        // If decreasing capacity, check for occupied slots
        if (newCapacity < oldCapacity) {
            const occupiedCheck = await pool.query(
                `SELECT COUNT(*) as count FROM BLOCK_ENTRIES 
                 WHERE block_id = $1 AND status = 'OCCUPIED'`,
                [blockId]
            );
            const occupiedCount = parseInt(occupiedCheck.rows[0].count);

            if (occupiedCount > newCapacity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reduce capacity. ${occupiedCount} slots are currently occupied.`
                });
            }
        }

        await pool.query('BEGIN');

        try {
            // Update block
            const updateQuery = `
                UPDATE BLOCKS
                SET block_name = $1,
                    capacity = $2,
                    valid_from = $3,
                    valid_to = $4,
                    status = $5
                WHERE block_id = $6
                RETURNING *
            `;
            const updateResult = await pool.query(updateQuery, [
                block_name.trim(),
                newCapacity,
                valid_from,
                valid_to,
                status,
                blockId
            ]);

            // Handle capacity changes
            if (newCapacity > oldCapacity) {
                // Add new entries
                const difference = newCapacity - oldCapacity;
                for (let i = 1; i <= difference; i++) {
                    const serialNumber = oldCapacity + i;
                    const entryId = generateBlockEntryId(blockId, serialNumber);

                    const entryQuery = `
                        INSERT INTO BLOCK_ENTRIES (block_entry_id, block_id, location_id, status, created_at)
                        VALUES ($1, $2, $3, 'AVAILABLE', NOW())
                    `;
                    await pool.query(entryQuery, [entryId, blockId, existingBlock.location_id]);
                }
            } else if (newCapacity < oldCapacity) {
                // Delete only AVAILABLE entries
                const difference = oldCapacity - newCapacity;

                const deleteQuery = `
                    DELETE FROM BLOCK_ENTRIES
                    WHERE block_entry_id IN (
                        SELECT block_entry_id
                        FROM BLOCK_ENTRIES
                        WHERE block_id = $1
                        AND status = 'AVAILABLE'
                        ORDER BY block_entry_id DESC
                        LIMIT $2
                    )
                `;
                await pool.query(deleteQuery, [blockId, difference]);
            }

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Block updated successfully.',
                data: updateResult.rows[0]
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Update block error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update block.'
        });
    }
};

module.exports = {
    createBlock,
    getBlocksWithEntries,
    updateBlock
};
