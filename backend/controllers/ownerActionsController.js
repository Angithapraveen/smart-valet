const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateManagerId, generateDriverId } = require('../services/userIdService');

/**
 * Create Manager (Owner only)
 */
const createManager = async (req, res) => {
    try {
        const { name, email_id, phone_number, password } = req.body;
        const { location_id } = req.params;
        const locationIds = req.locationIds || [];

        // Validate required fields
        if (!name || !email_id || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // Verify access: Owners need to be assigned to the location. Admins have access to all.
        const userRole = req.user?.role_name || req.user?.role;
        if (userRole !== 'ADMIN' && !locationIds.includes(location_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        // Get location short code
        const locationQuery = 'SELECT location_short_code FROM LOCATIONS WHERE location_id = $1';
        const locationResult = await pool.query(locationQuery, [location_id]);
        if (locationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }
        const locationShortCode = locationResult.rows[0].location_short_code;

        // Get MANAGER role_id
        const roleQuery = 'SELECT role_id FROM ROLE_MASTER WHERE role_name = $1';
        const roleResult = await pool.query(roleQuery, ['MANAGER']);
        if (roleResult.rows.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Manager role not found in system.'
            });
        }
        const managerRoleId = roleResult.rows[0].role_id;

        // Check if email already exists
        const emailCheck = await pool.query('SELECT user_id FROM USERS WHERE email_id = $1', [email_id.trim().toLowerCase()]);
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });
        }

        // Check if phone already exists
        const phoneCheck = await pool.query('SELECT user_id FROM USERS WHERE phone_number = $1', [phone_number.trim()]);
        if (phoneCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already exists.'
            });
        }

        // Generate Manager ID
        const managerId = await generateManagerId(locationShortCode);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('BEGIN');

        // Insert into USERS table
        const userQuery = `
            INSERT INTO USERS (user_id, name, email_id, phone_number, password, role_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING user_id, name, email_id, phone_number, role_id, status, created_at
        `;
        const userResult = await pool.query(userQuery, [
            managerId,
            String(name).trim(),
            String(email_id).trim().toLowerCase(),
            String(phone_number).trim(),
            hashedPassword,
            managerRoleId
        ]);
        const manager = userResult.rows[0];

        // Insert into LOCATION_ACCESS table
        const accessQuery = `
            INSERT INTO LOCATION_ACCESS (user_id, location_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        await pool.query(accessQuery, [managerId, location_id]);

        await pool.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Manager created successfully.',
            data: manager
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Create manager error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create manager.'
        });
    }
};

const createDriver = async (req, res) => {
    try {
        const { name, email_id, phone_number, password } = req.body;
        const { location_id } = req.params;
        const locationIds = req.locationIds || [];

        // Validate required fields
        if (!name || !email_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone number are required.'
            });
        }

        // Verify owner/manager has access to this location. ADMIN has access to all.
        const userRole = req.user?.role_name || req.user?.role;
        if (userRole !== 'ADMIN' && !locationIds.includes(location_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this location.'
            });
        }

        // Check if email already exists
        const emailCheck = await pool.query(
            `SELECT u.user_id, u.name, rm.role_name 
             FROM USERS u 
             JOIN ROLE_MASTER rm ON u.role_id = rm.role_id 
             WHERE u.email_id = $1`, 
            [email_id.trim().toLowerCase()]
        );

        if (emailCheck.rows.length > 0) {
            const existingUser = emailCheck.rows[0];
            
            // If they are not a DRIVER, we won't auto-assign
            if (existingUser.role_name !== 'DRIVER') {
                return res.status(409).json({
                    success: false,
                    message: `A user with this email exists but has the role: ${existingUser.role_name}.`
                });
            }

            // Check if they are already assigned to THIS location
            const assignmentCheck = await pool.query(
                'SELECT status FROM LOCATION_ACCESS WHERE user_id = $1 AND location_id = $2',
                [existingUser.user_id, location_id]
            );

            if (assignmentCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Driver is already assigned to this location.'
                });
            }

            // Verify they have no other 'ACTIVE' assignment at any other location
            const activeRes = await pool.query(
                "SELECT location_id FROM LOCATION_ACCESS WHERE user_id = $1 AND status = 'ACTIVE'",
                [existingUser.user_id]
            );

            if (activeRes.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Driver is currently active at another location. They must be deactivated there before assignment.'
                });
            }

            // All clear: Assign the existing driver to this location as INACTIVE
            await pool.query(
                'INSERT INTO LOCATION_ACCESS (user_id, location_id, status) VALUES ($1, $2, $3)',
                [existingUser.user_id, location_id, 'INACTIVE']
            );

            return res.status(200).json({
                success: true,
                message: 'Existing driver found and successfully assigned to this location as INACTIVE.',
                data: {
                    user_id: existingUser.user_id,
                    name: existingUser.name,
                    email_id: email_id
                }
            });
        }

        // --- Original logic for creating a NEW driver if they don't exist ---
        
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required for new drivers.' });
        }

        // Get location short code
        const locationQuery = 'SELECT location_short_code FROM LOCATIONS WHERE location_id = $1';
        const locationResult = await pool.query(locationQuery, [location_id]);
        if (locationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }
        const locationShortCode = locationResult.rows[0].location_short_code;

        // Get DRIVER role_id
        const roleQuery = 'SELECT role_id FROM ROLE_MASTER WHERE role_name = $1';
        const roleResult = await pool.query(roleQuery, ['DRIVER']);
        if (roleResult.rows.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Driver role not found in system.'
            });
        }
        const driverRoleId = roleResult.rows[0].role_id;

        // Check if phone already exists
        const phoneCheck = await pool.query('SELECT user_id FROM USERS WHERE phone_number = $1', [phone_number.trim()]);
        if (phoneCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already exists.'
            });
        }

        // Generate Driver ID
        const driverId = await generateDriverId(locationShortCode);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('BEGIN');

        // Insert into USERS table
        const userQuery = `
            INSERT INTO USERS (user_id, name, email_id, phone_number, password, role_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING user_id, name, email_id, phone_number, role_id, status, created_at
        `;
        const userResult = await pool.query(userQuery, [
            driverId,
            String(name).trim(),
            String(email_id).trim().toLowerCase(),
            String(phone_number).trim(),
            hashedPassword,
            driverRoleId
        ]);
        const driver = userResult.rows[0];

        // Insert into LOCATION_ACCESS table
        const accessQuery = `
            INSERT INTO LOCATION_ACCESS (user_id, location_id, status)
            VALUES ($1, $2, 'INACTIVE')
            RETURNING *
        `;
        await pool.query(accessQuery, [driverId, location_id]);

        await pool.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'New driver created successfully and assigned as INACTIVE.',
            data: driver
        });

    } catch (error) {
        if (pool.query) await pool.query('ROLLBACK');
        console.error('Create driver error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to manage driver assignment.'
        });
    }
};

/**
 * Toggle Status of Manager or Driver (Owner only)
 */
const updateMemberStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const locationIds = req.locationIds || [];

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'status must be a boolean value.'
            });
        }

        // Verify access: ADMIN bypasses location check
        const userRole = req.user?.role_name || req.user?.role;

        if (userRole !== 'ADMIN') {
            // 1. Verify location access
            const accessCheckQuery = `
                SELECT la2.user_id, rm.role_name as target_role
                FROM LOCATION_ACCESS la1
                JOIN LOCATION_ACCESS la2 ON la1.location_id = la2.location_id
                JOIN USERS u ON la2.user_id = u.user_id
                JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
                WHERE la1.user_id = $1 -- Current Owner/Manager
                AND la2.user_id = $2 -- Targeted User
                LIMIT 1
            `;
            const accessCheck = await pool.query(accessCheckQuery, [req.user.user_id, userId]);

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only manage users assigned to your locations.'
                });
            }

            // 2. Role Restriction: MANAGER can only manage DRIVER status
            const targetRole = accessCheck.rows[0].target_role;
            if (userRole === 'MANAGER' && targetRole === 'MANAGER') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Managers cannot modify status of other Managers.'
                });
            }
        }

        const query = `
            UPDATE USERS 
            SET status = $1 
            WHERE user_id = $2
            RETURNING user_id, status, name
        `;
        const result = await pool.query(query, [status, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            message: `User ${status ? 'activated' : 'deactivated'} successfully.`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update member status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user status.'
        });
    }
};

/**
 * Update member details (Owner/Manager only)
 */
const updateMemberDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email_id, phone_number } = req.body;
        const userRole = req.user?.role_name || req.user?.role;

        if (!name || !email_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone number are required.'
            });
        }

        // Verify access: ADMIN bypasses location check
        if (userRole !== 'ADMIN') {
            // 1. Verify location access
            const accessCheckQuery = `
                SELECT la2.user_id, rm.role_name as target_role
                FROM LOCATION_ACCESS la1
                JOIN LOCATION_ACCESS la2 ON la1.location_id = la2.location_id
                JOIN USERS u ON la2.user_id = u.user_id
                JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
                WHERE la1.user_id = $1 -- Current Requester
                AND la2.user_id = $2 -- Targeted User
                LIMIT 1
            `;
            const accessCheck = await pool.query(accessCheckQuery, [req.user.user_id, userId]);

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only manage users assigned to your locations.'
                });
            }

            // 2. Role Restriction: MANAGER can only edit DRIVER details
            const targetRole = accessCheck.rows[0].target_role;
            if (userRole === 'MANAGER' && targetRole === 'MANAGER') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Managers cannot edit details of other Managers.'
                });
            }
        }

        const query = `
            UPDATE USERS 
            SET name = $1, email_id = $2, phone_number = $3
            WHERE user_id = $4
            RETURNING user_id, name, email_id, phone_number, status
        `;
        const result = await pool.query(query, [name, email_id, phone_number, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            message: 'User details updated successfully.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update member details error:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Email or phone number already exists.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update user details.'
        });
    }
};

module.exports = {
    createManager,
    createDriver,
    updateMemberStatus,
    updateMemberDetails
};
