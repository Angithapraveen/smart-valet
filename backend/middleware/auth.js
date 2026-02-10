const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user details from database
        const userQuery = `
            SELECT u.user_id, u.name, u.email_id, u.phone_number, u.role_id, u.status,
                   rm.role_name
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE u.user_id = $1 AND u.status = TRUE
        `;
        
        const userResult = await pool.query(userQuery, [decoded.user_id]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found or inactive.'
            });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

module.exports = { authenticate };
