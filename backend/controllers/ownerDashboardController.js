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
 * Get Users for a specific location (Access Check)
 */
const getOwnerLocationUsers = async (req, res) => {
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
                u.user_id, u.name, u.email_id, u.phone_number, u.status,
                rm.role_name
            FROM USERS u
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE la.location_id = $1
            ORDER BY u.name ASC
        `;

        const result = await pool.query(query, [id]);
        const users = result.rows;

        // Group by role
        const groupedUsers = {
            owners: users.filter(u => u.role_name === 'OWNER'),
            managers: users.filter(u => u.role_name === 'MANAGER'),
            drivers: users.filter(u => u.role_name === 'DRIVER')
        };

        res.json({
            success: true,
            data: groupedUsers
        });

    } catch (error) {
        console.error('Get owner location users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location users.'
        });
    }
};

module.exports = {
    getOwnerSummary,
    getOwnerLocations,
    getOwnerLocationUsers
};
