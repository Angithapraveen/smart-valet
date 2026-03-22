const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Login Controller
 * Handles login for ADMIN, OWNER, MANAGER
 * Driver login is handled separately in mobile app
 * 
 * Accepts login_id which can be: email_id, or phone_number
 * 
 */
const login = async (req, res) => {
    try {
        const { login_id, password } = req.body;

        // Validation
        if (!login_id || !password) {
            return res.status(400).json({
                success: false,
                message: 'Login ID and password are required.'
            });
        }

        // Find user by email_id, or phone_number
        const user = await User.findByLoginId(login_id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Check if user is DRIVER (drivers login via mobile app)
        // if (user.role_name === 'DRIVER') {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Driver login is available only through mobile app.'
        //     });
        // }

        // Verify password - support both plain text (development) and bcrypt (production)
        let isPasswordValid = false;

        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
            // Password is bcrypt hashed
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Password is plain text (development only)
            isPasswordValid = password === user.password;
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Get accessible locations based on role
        const accessibleLocations = await User.getAccessibleLocations(user.user_id, user.role_name);

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role_name: user.role_name,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return response as per requirements
        res.json({
            success: true,
            user_id: user.user_id,
            name: user.name,
            email_id: user.email_id,
            phone_number: user.phone_number,
            role: user.role_name, // Must be ADMIN | OWNER | MANAGER
            role_id: user.role_id,
            accessibleLocations: accessibleLocations || [],
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
    try {
        const accessibleLocations = await User.getAccessibleLocations(
            req.user.user_id,
            req.user.role_name
        );

        res.json({
            success: true,
            data: {
                user: {
                    user_id: req.user.user_id,
                    name: req.user.name,
                    email_id: req.user.email_id,
                    phone_number: req.user.phone_number,
                    role_name: req.user.role_name,
                    role: req.user.role_name,
                    role_id: req.user.role_id,
                    created_at: req.user.created_at
                },
                accessibleLocations
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user information.'
        });
    }
};



/**
 * Update User Profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name, phone_number } = req.body;

        if (!name && !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        const updatedUser = await User.update(userId, { name, phone_number });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Return updated user info
        res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                email_id: updatedUser.email_id,
                phone_number: updatedUser.phone_number,
                role_id: updatedUser.role_id
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile.'
        });
    }
};
module.exports = {
    login,
    getCurrentUser,
    updateProfile
};
