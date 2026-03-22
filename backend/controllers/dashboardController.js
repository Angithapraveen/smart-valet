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
 * Get Admin Dashboard Summary
 */
const getAdminSummary = async (req, res) => {
    try {
        const locationsCount = await pool.query('SELECT COUNT(*) FROM LOCATIONS WHERE status = TRUE');
        const ownersCount = await pool.query("SELECT COUNT(*) FROM USERS u JOIN ROLE_MASTER rm ON u.role_id = rm.role_id WHERE rm.role_name = 'OWNER' AND u.status = TRUE");
        const driversCount = await pool.query("SELECT COUNT(*) FROM USERS u JOIN ROLE_MASTER rm ON u.role_id = rm.role_id WHERE rm.role_name = 'DRIVER' AND u.status = TRUE");

        res.json({
            success: true,
            data: {
                total_locations: parseInt(locationsCount.rows[0].count),
                total_owners: parseInt(ownersCount.rows[0].count),
                total_drivers: parseInt(driversCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Admin summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load admin summary.'
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
                    availableBlocks: 0,
                    blocksData: [],
                    recentActivity: [],
                    drivers: [],
                    todayStats: {
                        entered: 0,
                        returned: 0
                    }
                }
            });
        }

        // Manager has only one location
        const locationId = locationIds[0];

        // 1. Get manager's location
        const locationQuery = 'SELECT * FROM LOCATIONS WHERE location_id = $1 AND status = TRUE';
        const locationResult = await pool.query(locationQuery, [locationId]);

        // 2. Total Transactions (All time)
        const transactionsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = $1
        `;
        const transactionsResult = await pool.query(transactionsQuery, [locationId]);

        // 3. Active Parkings (Currently in system)
        const activeParkingsQuery = `
            SELECT COUNT(*) as total 
            FROM VALET_TRANSACTIONS 
            WHERE location_id = $1 AND status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
        `;
        const activeParkingsResult = await pool.query(activeParkingsQuery, [locationId]);

        // 4. Available Block Entries (Total)
        const availableEntriesQuery = `
            SELECT COUNT(*) as total 
            FROM BLOCK_ENTRIES 
            WHERE location_id = $1 AND status = 'AVAILABLE'
        `;
        const availableEntriesResult = await pool.query(availableEntriesQuery, [locationId]);

        // 5. Detailed Block Data (Capacity vs Occupancy)
        const blocksQuery = `
            SELECT 
                b.block_id, 
                b.block_name, 
                b.capacity,
                (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'AVAILABLE') as available,
                (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'OCCUPIED') as occupied
            FROM BLOCKS b
            WHERE b.location_id = $1 AND b.status = TRUE
            ORDER BY b.block_name
        `;
        const blocksResult = await pool.query(blocksQuery, [locationId]);

        // 6. Recent Activity (Last 5 transactions)
        const activityQuery = `
            SELECT valet_id, car_model, customer_name, status, created_at, returned_time
            FROM VALET_TRANSACTIONS
            WHERE location_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `;
        const activityResult = await pool.query(activityQuery, [locationId]);

        // 7. Active Drivers (Drivers associated with this location)
        // Assuming drivers are linked via LOCATION_ACCESS table same as managers
        const driversQuery = `
            SELECT u.user_id, u.name, u.phone_number, u.status
            FROM USERS u
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE la.location_id = $1 AND rm.role_name = 'DRIVER' AND u.status = TRUE
        `;
        const driversResult = await pool.query(driversQuery, [locationId]);

        // 8. Today's Stats
        const todayStatsQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as entered,
                COUNT(*) FILTER (WHERE returned_time::date = CURRENT_DATE) as returned
            FROM VALET_TRANSACTIONS
            WHERE location_id = $1
        `;
        const todayStatsResult = await pool.query(todayStatsQuery, [locationId]);


        res.json({
            success: true,
            data: {
                location: locationResult.rows[0] || null,
                totalTransactions: parseInt(transactionsResult.rows[0].total),
                activeParkings: parseInt(activeParkingsResult.rows[0].total),
                availableBlocks: parseInt(availableEntriesResult.rows[0].total),
                blocksData: blocksResult.rows,
                recentActivity: activityResult.rows,
                drivers: driversResult.rows,
                todayStats: {
                    entered: parseInt(todayStatsResult.rows[0].entered || 0),
                    returned: parseInt(todayStatsResult.rows[0].returned || 0)
                }
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
    getAdminSummary,
    getOwnerDashboard,
    getManagerDashboard
};
