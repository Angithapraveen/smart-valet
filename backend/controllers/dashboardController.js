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
        const userId = req.user?.user_id;
        const locationIds = req.locationIds;
        
        console.log(`[Dashboard-Manager] Fetching for User: ${userId}, Locations: ${locationIds?.join(', ')}`);

        if (!locationIds || locationIds.length === 0) {
            console.warn('[Dashboard-Manager] No location access for manager:', userId);
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
                    todayStats: { entered: 0, returned: 0 }
                }
            });
        }

        const locationId = locationIds[0];

        // Parallel execution for better performance
        const [
            locationRes,
            statsRes,
            activeRes,
            availRes,
            blocksRes,
            activityRes,
            driversRes,
            todayRes
        ] = await Promise.all([
            pool.query('SELECT * FROM LOCATIONS WHERE location_id = $1 AND status = TRUE', [locationId]),
            pool.query('SELECT COUNT(*) as total FROM VALET_TRANSACTIONS WHERE location_id = $1', [locationId]),
            pool.query("SELECT COUNT(*) as total FROM VALET_TRANSACTIONS WHERE location_id = $1 AND status IN ('PARKED', 'RETURN_REQUESTED', 'READY', 'ON_THE_WAY')", [locationId]),
            pool.query("SELECT COUNT(*) as total FROM BLOCK_ENTRIES WHERE location_id = $1 AND status = 'AVAILABLE'", [locationId]),
            pool.query(`
                SELECT 
                    b.block_id, b.block_name, b.capacity,
                    (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'AVAILABLE') as available,
                    (SELECT COUNT(*) FROM BLOCK_ENTRIES be WHERE be.block_id = b.block_id AND be.status = 'OCCUPIED') as occupied
                FROM BLOCKS b
                WHERE b.location_id = $1 AND b.status = TRUE
                ORDER BY b.block_name`, [locationId]),
            pool.query(`
                SELECT valet_id, car_model, customer_name, status, created_at, returned_time, key_slot
                FROM VALET_TRANSACTIONS
                WHERE location_id = $1
                ORDER BY created_at DESC
                LIMIT 10`, [locationId]),
            pool.query(`
                SELECT u.user_id, u.name, u.phone_number, u.status
                FROM USERS u
                JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
                JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
                WHERE la.location_id = $1 AND rm.role_name = 'DRIVER' AND u.status = TRUE`, [locationId]),
            pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as entered,
                    COUNT(*) FILTER (WHERE returned_time::date = CURRENT_DATE) as returned
                FROM VALET_TRANSACTIONS
                WHERE location_id = $1`, [locationId])
        ]);

        console.log(`[Dashboard-Manager] Data fetched for location ${locationId}. Activity count: ${activityRes.rows.length}`);

        return res.json({
            success: true,
            data: {
                location: locationRes.rows[0] || null,
                totalTransactions: parseInt(statsRes.rows[0]?.total || 0),
                activeParkings: parseInt(activeRes.rows[0]?.total || 0),
                availableBlocks: parseInt(availRes.rows[0]?.total || 0),
                blocksData: blocksRes.rows || [],
                recentActivity: activityRes.rows || [],
                drivers: driversRes.rows || [],
                todayStats: {
                    entered: parseInt(todayRes.rows[0]?.entered || 0),
                    returned: parseInt(todayRes.rows[0]?.returned || 0)
                }
            }
        });

    } catch (error) {
        console.error('[Dashboard-Manager-Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while loading dashboard.',
            error: error.message
        });
    }
};


module.exports = {
    getAdminDashboard,
    getAdminSummary,
    getOwnerDashboard,
    getManagerDashboard
};
