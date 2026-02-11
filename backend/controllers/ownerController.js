const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Location = require('../models/Location');
const { generateOwnerId, getOwnerRoleId } = require('../services/ownerService');
const pool = require('../config/database');

/**
 * POST /api/admin/owners
 * Create owner and assign to location (Admin only)
 */
async function createOwner(req, res) {
    try {
    

        const {
            name,
            email_id,
            phone_number,
            password,
            location_id
        } = req.body;

        // STEP 1 - Validate request body
        if (!name || !email_id || !phone_number || !password || !location_id) {
            return res.status(400).json({
                success: false,
                message: 'name, email_id, phone_number, password, and location_id are required.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.'
            });
        }

        // Validate phone format (basic)
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(phone_number) || phone_number.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format.'
            });
        }

        // STEP 2 - Check duplicates (email and phone)
        const duplicateCheck = await pool.query(
            'SELECT user_id, email_id, phone_number FROM USERS WHERE email_id = $1 OR phone_number = $2',
            [email_id.trim().toLowerCase(), phone_number.trim()]
        );
        if (duplicateCheck.rows.length > 0) {
            const duplicate = duplicateCheck.rows[0];
            if (duplicate.email_id === email_id.trim().toLowerCase()) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }
            if (duplicate.phone_number === phone_number.trim()) {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number already exists.'
                });
            }
        }

        // STEP 3 - Verify location exists and is active
        const location = await pool.query(
            'SELECT * FROM LOCATIONS WHERE location_id = $1 AND status = TRUE',
            [location_id]
        );
        if (location.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Location not found or inactive.'
            });
        }

        // STEP 4 - Get OWNER role_id
        const ownerRoleId = await getOwnerRoleId();
        if (!ownerRoleId) {
            return res.status(500).json({
                success: false,
                message: 'OWNER role not found in system.'
            });
        }

        // STEP 5 - Generate Owner ID
        const ownerId = await generateOwnerId();
        console.log('Generated Owner ID:', ownerId);

        // STEP 6 - Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // STEP 7 - Database transaction
        await pool.query('BEGIN');

        try {
            // Insert into USERS table
            const userQuery = `
                INSERT INTO USERS (user_id, name, email_id, phone_number, password, role_id, status)
                VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                RETURNING user_id, name, email_id, phone_number, role_id, status, created_at
            `;
            const userResult = await pool.query(userQuery, [
                ownerId,
                String(name).trim(),
                String(email_id).trim().toLowerCase(),
                String(phone_number).trim(),
                hashedPassword,
                ownerRoleId
            ]);
            const owner = userResult.rows[0];

            // Insert into LOCATION_ACCESS table
            const accessQuery = `
                INSERT INTO LOCATION_ACCESS (user_id, location_id)
                VALUES ($1, $2)
                RETURNING *
            `;
            const accessResult = await pool.query(accessQuery, [ownerId, location_id]);

            await pool.query('COMMIT');

            console.log('Owner created successfully:', ownerId);

            return res.status(201).json({
                success: true,
                message: 'Owner created and assigned to location successfully.',
                data: {
                    owner: {
                        user_id: owner.user_id,
                        name: owner.name,
                        email_id: owner.email_id,
                        phone_number: owner.phone_number,
                        role_id: owner.role_id
                    },
                    location_access: accessResult.rows[0]
                }
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Transaction error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Create owner error:', error);
        console.error('Error details:', {
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
            message: error.message
        });
        
        if (error.code === '23505') {
            // Unique constraint violation
            if (error.constraint === 'users_email_id_key') {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists.'
                });
            }
            if (error.constraint === 'users_phone_number_key') {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number already exists.'
                });
            }
            return res.status(409).json({
                success: false,
                message: 'Owner ID, email, or phone number already exists.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create owner.'
        });
    }
}

/**
 * GET /api/admin/owners
 * Get all owners (Admin only)
 */
async function getOwners(req, res) {
    try {
        const query = `
            SELECT u.user_id, u.name, u.email_id, u.phone_number, u.status, u.created_at,
                   rm.role_name,
                   COUNT(la.location_id) as location_count
            FROM USERS u
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            LEFT JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            WHERE rm.role_name = 'OWNER'
            GROUP BY u.user_id, u.name, u.email_id, u.phone_number, u.status, u.created_at, rm.role_name
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get owners error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch owners.'
        });
    }
}

module.exports = {
    createOwner,
    getOwners
};
