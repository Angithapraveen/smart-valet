const pool = require('../config/database');

/**
 * Get Owner Dashboard Summary
 * Returns counts for accessible Locations, Managers, Drivers
 */
const getOwnerSummary = async (req, res) => {
    try {
        const locationIds = req.locationIds || [];

        if (locationIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    total_locations: 0,
                    total_managers: 0,
                    total_drivers: 0
                }
            });
        }

        // Count accessible locations
        const locationsCount = locationIds.length;

        // Count Managers linked to these locations
        // Managers are linked to locations via LOCATION_ACCESS
        const managersQuery = `
            SELECT COUNT(DISTINCT u.user_id) 
            FROM USERS u 
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id 
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            WHERE rm.role_name = 'MANAGER' 
            AND u.status = TRUE
            AND la.location_id = ANY($1::VARCHAR[])
        `;
        const managersResult = await pool.query(managersQuery, [locationIds]);

        // Count Drivers linked to these locations
        const driversQuery = `
            SELECT COUNT(DISTINCT u.user_id) 
            FROM USERS u 
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id 
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            WHERE rm.role_name = 'DRIVER' 
            AND u.status = TRUE
            AND la.location_id = ANY($1::VARCHAR[])
        `;
        const driversResult = await pool.query(driversQuery, [locationIds]);

        res.json({
            success: true,
            data: {
                total_locations: locationsCount,
                total_managers: parseInt(managersResult.rows[0].count),
                total_drivers: parseInt(driversResult.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Owner dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard summary.'
        });
    }
};

/**
 * Get Owner Locations with Stats
 */
const getOwnerLocations = async (req, res) => {
    try {
        const locationIds = req.locationIds || [];

        if (locationIds.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const query = `
            SELECT 
                l.location_id, l.location_name, l.location_type, l.address, l.status,
                l.valid_from, l.valid_to,
                COALESCE(b.total_blocks, 0) as total_blocks,
                COALESCE(be.available_slots, 0) as available_slots,
                COALESCE(be.occupied_slots, 0) as occupied_slots,
                COALESCE(vt.active_parkings, 0) as active_parkings
            FROM LOCATIONS l
            LEFT JOIN (
                SELECT location_id, COUNT(*) as total_blocks 
                FROM BLOCKS 
                WHERE status = TRUE 
                GROUP BY location_id
            ) b ON l.location_id = b.location_id
            LEFT JOIN (
                SELECT 
                    location_id,
                    COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_slots,
                    COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied_slots
                FROM BLOCK_ENTRIES 
                GROUP BY location_id
            ) be ON l.location_id = be.location_id
            LEFT JOIN (
                SELECT location_id, COUNT(*) as active_parkings 
                FROM VALET_TRANSACTIONS 
                WHERE status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
                GROUP BY location_id
            ) vt ON l.location_id = vt.location_id
            WHERE l.location_id = ANY($1::VARCHAR[])
            ORDER BY l.created_at DESC
        `;

        const result = await pool.query(query, [locationIds]);

        const locations = result.rows.map(row => ({
            ...row,
            total_blocks: parseInt(row.total_blocks),
            available_slots: parseInt(row.available_slots),
            occupied_slots: parseInt(row.occupied_slots),
            active_parkings: parseInt(row.active_parkings)
        }));

        res.json({
            success: true,
            data: locations
        });

    } catch (error) {
        console.error('Get owner locations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch locations.'
        });
    }
};

/**
 * Get Owner Location Details (Single)
 */
const getOwnerLocationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const locationIds = req.locationIds || [];

        if (!locationIds.includes(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        const query = `
            SELECT 
                l.location_id, l.location_name, l.location_type, l.address, l.status,
                l.valid_from, l.valid_to,
                COALESCE(b.total_blocks, 0) as total_blocks,
                COALESCE(be.available_slots, 0) as available_slots,
                COALESCE(be.occupied_slots, 0) as occupied_slots,
                COALESCE(vt.active_parkings, 0) as active_parkings
            FROM LOCATIONS l
            LEFT JOIN (
                SELECT location_id, COUNT(*) as total_blocks 
                FROM BLOCKS 
                WHERE status = TRUE 
                GROUP BY location_id
            ) b ON l.location_id = b.location_id
            LEFT JOIN (
                SELECT 
                    location_id,
                    COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_slots,
                    COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied_slots
                FROM BLOCK_ENTRIES 
                GROUP BY location_id
            ) be ON l.location_id = be.location_id
            LEFT JOIN (
                SELECT location_id, COUNT(*) as active_parkings 
                FROM VALET_TRANSACTIONS 
                WHERE status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
                GROUP BY location_id
            ) vt ON l.location_id = vt.location_id
            WHERE l.location_id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }

        const row = result.rows[0];

        // Count managers and drivers specifically for this location
        const countQuery = `
            SELECT 
                COUNT(DISTINCT CASE WHEN rm.role_name = 'MANAGER' THEN u.user_id END) as total_managers,
                COUNT(DISTINCT CASE WHEN rm.role_name = 'DRIVER' THEN u.user_id END) as total_drivers
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            WHERE la.location_id = $1 AND u.status = TRUE
        `;
        const countResult = await pool.query(countQuery, [id]);
        const counts = countResult.rows[0];

        const locationData = {
            location_id: row.location_id,
            location_name: row.location_name,
            location_type: row.location_type,
            address: row.address,
            status: row.status,
            valid_from: row.valid_from,
            valid_to: row.valid_to
        };

        const statsData = {
            total_blocks: parseInt(row.total_blocks),
            available_slots: parseInt(row.available_slots),
            occupied_slots: parseInt(row.occupied_slots),
            active_parkings: parseInt(row.active_parkings),
            total_managers: parseInt(counts.total_managers),
            total_drivers: parseInt(counts.total_drivers)
        };

        res.json({
            success: true,
            data: {
                location: locationData,
                stats: statsData
            }
        });

    } catch (error) {
        console.error('Get owner location details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location details.'
        });
    }
};

/**
 * Get Users for a specific location (Access Check)
 * Supports ?type=managers|drivers|owners
 */
const getOwnerLocationUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // Support filtering
        const locationIds = req.locationIds || [];

        // Verify access
        if (!locationIds.includes(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        let roleFilter = '';
        if (type === 'managers') roleFilter = "AND rm.role_name = 'MANAGER'";
        if (type === 'drivers') roleFilter = "AND rm.role_name = 'DRIVER'";
        if (type === 'owners') roleFilter = "AND rm.role_name = 'OWNER'";

        const query = `
            SELECT 
                u.user_id, u.name, u.email_id, u.phone_number, u.status,
                rm.role_name
            FROM USERS u
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE la.location_id = $1 ${roleFilter}
            ORDER BY u.name ASC
        `;

        const result = await pool.query(query, [id]);
        const users = result.rows;

        // If a specific type was requested, return just that list (or object with that key for consistency? Spec says "load data BELOW", likely array expected if implicit from "tabData = ref([])")
        // But the previous implementation returned { owners: [], ... }.
        // If I want to support the OLD behavior, I should stick to the structure.
        // If I use type, I will return the list directly OR the structure.
        // The spec example for LIST DISPLAY is `v-for="user in tabData"`.
        // So if type is present, return the array directly.

        if (type) {
            res.json({
                success: true,
                data: users
            });
        } else {
            // Group by role (Original behavior)
            const groupedUsers = {
                owners: users.filter(u => u.role_name === 'OWNER'),
                managers: users.filter(u => u.role_name === 'MANAGER'),
                drivers: users.filter(u => u.role_name === 'DRIVER')
            };

            res.json({
                success: true,
                data: groupedUsers
            });
        }

    } catch (error) {
        console.error('Get owner location users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location users.'
        });
    }
};

/**
 * Get Blocks for a specific location (Access Check)
 */
const getOwnerLocationBlocks = async (req, res) => {
    try {
        const { id } = req.params;
        const locationIds = req.locationIds || [];

        // Verify access
        if (!locationIds.includes(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        const query = `
            SELECT 
                b.block_id, b.block_code, b.block_type, b.floor_number, b.status,
                b.capacity,
                (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'AVAILABLE') as available_slots,
                (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'OCCUPIED') as occupied_slots
            FROM BLOCKS b
            WHERE b.location_id = $1
            ORDER BY b.floor_number, b.block_code
        `;

        const result = await pool.query(query, [id]);

        const blocks = result.rows.map(block => ({
            ...block,
            capacity: parseInt(block.capacity),
            available_slots: parseInt(block.available_slots),
            occupied_slots: parseInt(block.occupied_slots)
        }));

        res.json({
            success: true,
            data: blocks
        });

    } catch (error) {
        console.error('Get owner location blocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location blocks.'
        });
    }
};

module.exports = {
    getOwnerSummary,
    getOwnerLocations,
    getOwnerLocationUsers,
    getOwnerLocationBlocks,
    getOwnerLocationDetails
};
