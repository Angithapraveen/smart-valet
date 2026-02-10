const pool = require('../config/database');

class User {
    /**
     * Find user by user_id, email_id, or phone_number (for login)
     * login_id can be any of: user_id, email_id, or phone_number
     */
    static async findByLoginId(loginId) {
        const query = `
            SELECT u.user_id, u.name, u.email_id, u.phone_number, u.password, 
                   u.role_id, u.status, rm.role_name
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE (u.user_id = $1 OR u.email_id = $1 OR u.phone_number = $1) 
            AND u.status = TRUE
        `;
        const result = await pool.query(query, [loginId]);
        return result.rows[0] || null;
    }

    /**
     * Get user accessible locations based on role
     */
    static async getAccessibleLocations(userId, roleName) {
        if (roleName === 'ADMIN') {
            const result = await pool.query(
                'SELECT location_id, location_name, location_type, address, status FROM LOCATIONS WHERE status = TRUE'
            );
            return result.rows;
        } else {
            const result = await pool.query(
                `SELECT l.location_id, l.location_name, l.location_type, l.address, l.status
                 FROM LOCATION_ACCESS la
                 JOIN LOCATIONS l ON la.location_id = l.location_id
                 WHERE la.user_id = $1 AND l.status = TRUE`,
                [userId]
            );
            return result.rows;
        }
    }

    /**
     * Create new user
     */
    static async create(userData) {
        const { user_id, name, email_id, phone_number, password, role_id } = userData;
        const query = `
            INSERT INTO USERS (user_id, name, email_id, phone_number, password, role_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, name, email_id, phone_number, role_id, status, created_at
        `;
        const result = await pool.query(query, [user_id, name, email_id, phone_number, password, role_id]);
        return result.rows[0];
    }

    /**
     * Get user by ID
     */
    static async findById(userId) {
        const query = `
            SELECT u.user_id, u.name, u.email_id, u.phone_number, u.role_id, u.status,
                   rm.role_name
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE u.user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    }
}

module.exports = User;
