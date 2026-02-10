const pool = require('../config/database');

/**
 * Admin Dashboard Controller
 */
const getAdminDashboard = async (req, res) => {
    try {
        // Admin can see all locations
        const locationsQuery = 'SELECT * FROM LOCATIONS WHERE status = TRUE ORDER BY created_at DESC';
        const locationsResult = await pool.query(locationsQuery);

        // Get total users by role
        const usersQuery = `
            SELECT rm.role_name, COUNT(*) as count
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE u.status = TRUE
            GROUP BY rm.role_name
        `;
        const usersResult = await pool.query(usersQuery);

        // Get total transactions
        const transactionsQuery = 'SELECT COUNT(*) as total FROM VALET_TRANSACTIONS';
        const transactionsResult = await pool.query(transactionsQuery);

        res.json({
            success: true,
            data: {
                locations: locationsResult.rows,
                userStats: usersResult.rows,
                totalTransactions: parseInt(transactionsResult.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load admin dashboard.'
        });
    }
};

/**
 * Owner Dashboard Controller
 */
const getOwnerDashboard = async (req, res) => {
    try {
        const locationIds = req.locationIds;

        if (!locationIds || locationIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    locations: [],
                    totalTransactions: 0,
                    activeParkings: 0
                }
            });
        }

        // Get owner's locations
        const locationsQuery = `
            SELECT * FROM LOCATIONS 
            WHERE location_id = ANY($1::VARCHAR[]) AND status = TRUE
            ORDER BY created_at DESC
        `;
        const locationsResult = await pool.query(locationsQuery, [locationIds]);

        // Get total transactions for owner's locations
        const transactionsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = ANY($1::VARCHAR[])
        `;
        const transactionsResult = await pool.query(transactionsQuery, [locationIds]);

        // Get active parkings
        const activeParkingsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = ANY($1::VARCHAR[]) AND status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
        `;
        const activeParkingsResult = await pool.query(activeParkingsQuery, [locationIds]);

        res.json({
            success: true,
            data: {
                locations: locationsResult.rows,
                totalTransactions: parseInt(transactionsResult.rows[0].total),
                activeParkings: parseInt(activeParkingsResult.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Owner dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load owner dashboard.'
        });
    }
};

/**
 * Manager Dashboard Controller
 */
const getManagerDashboard = async (req, res) => {
    try {
        const locationIds = req.locationIds;

        if (!locationIds || locationIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    location: null,
                    totalTransactions: 0,
                    activeParkings: 0,
                    availableBlocks: 0
                }
            });
        }

        // Manager has only one location
        const locationId = locationIds[0];

        // Get manager's location
        const locationQuery = 'SELECT * FROM LOCATIONS WHERE location_id = $1 AND status = TRUE';
        const locationResult = await pool.query(locationQuery, [locationId]);

        // Get total transactions
        const transactionsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = $1
        `;
        const transactionsResult = await pool.query(transactionsQuery, [locationId]);

        // Get active parkings
        const activeParkingsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = $1 AND status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
        `;
        const activeParkingsResult = await pool.query(activeParkingsQuery, [locationId]);

        // Get available block entries
        const availableEntriesQuery = `
            SELECT COUNT(*) as total 
            FROM BLOCK_ENTRIES 
            WHERE location_id = $1 AND status = 'AVAILABLE'
        `;
        const availableEntriesResult = await pool.query(availableEntriesQuery, [locationId]);

        res.json({
            success: true,
            data: {
                location: locationResult.rows[0] || null,
                totalTransactions: parseInt(transactionsResult.rows[0].total),
                activeParkings: parseInt(activeParkingsResult.rows[0].total),
                availableBlocks: parseInt(availableEntriesResult.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Manager dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load manager dashboard.'
        });
    }
};

module.exports = {
    getAdminDashboard,
    getOwnerDashboard,
    getManagerDashboard
};
