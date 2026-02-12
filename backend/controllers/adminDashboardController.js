const pool = require('../config/database');

/**
 * Get Admin Dashboard Summary
 * Returns counts for Locations, Owners, Managers, Drivers
 */
const getDashboardSummary = async (req, res) => {
    try {
        const locationsCount = await pool.query('SELECT COUNT(*) FROM LOCATIONS WHERE status = TRUE');

        // Count users by role
        const ownersCount = await pool.query(
            "SELECT COUNT(*) FROM USERS u JOIN ROLE_MASTER rm ON u.role_id = rm.role_id WHERE rm.role_name = 'OWNER' AND u.status = TRUE"
        );
        const managersCount = await pool.query(
            "SELECT COUNT(*) FROM USERS u JOIN ROLE_MASTER rm ON u.role_id = rm.role_id WHERE rm.role_name = 'MANAGER' AND u.status = TRUE"
        );
        const driversCount = await pool.query(
            "SELECT COUNT(*) FROM USERS u JOIN ROLE_MASTER rm ON u.role_id = rm.role_id WHERE rm.role_name = 'DRIVER' AND u.status = TRUE"
        );

        res.json({
            success: true,
            data: {
                total_locations: parseInt(locationsCount.rows[0].count),
                total_owners: parseInt(ownersCount.rows[0].count),
                total_managers: parseInt(managersCount.rows[0].count),
                total_drivers: parseInt(driversCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard summary.'
        });
    }
};

/**
 * Get users for a specific location grouped by role
 */
const getLocationUsers = async (req, res) => {
    try {
        const { id } = req.params; // location_id

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
        console.error('Get location users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location users.'
        });
    }
};

module.exports = {
    getDashboardSummary,
    getLocationUsers
};
