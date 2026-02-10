const pool = require('../config/database');

/**
 * Role-based Access Control Middleware
 * Checks if user has required role(s)
 */
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const userRole = req.user.role_name;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
                });
            }

            next();
        } catch (error) {
            console.error('Role access middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error.'
            });
        }
    };
};

/**
 * Location Access Middleware
 * Attaches accessible locations to request based on role
 */
const attachLocationAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const userRole = req.user.role_name;
        let accessibleLocations = [];

        if (userRole === 'ADMIN') {
            // ADMIN can access ALL locations
            const result = await pool.query(
                'SELECT location_id, location_name, location_type, address, status FROM LOCATIONS WHERE status = TRUE'
            );
            accessibleLocations = result.rows;
        } else if (userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'DRIVER') {
            // OWNER, MANAGER, DRIVER get locations from LOCATION_ACCESS
            const result = await pool.query(
                `SELECT l.location_id, l.location_name, l.location_type, l.address, l.status
                 FROM LOCATION_ACCESS la
                 JOIN LOCATIONS l ON la.location_id = l.location_id
                 WHERE la.user_id = $1 AND l.status = TRUE`,
                [req.user.user_id]
            );
            accessibleLocations = result.rows;
        }

        req.accessibleLocations = accessibleLocations;
        req.locationIds = accessibleLocations.map(loc => loc.location_id);

        next();
    } catch (error) {
        console.error('Location access middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching location access.'
        });
    }
};

/**
 * Validate Location Access
 * Ensures user can only access their assigned locations
 */
const validateLocationAccess = (req, res, next) => {
    const requestedLocationId = req.params.locationId || req.body.location_id || req.query.location_id;

    if (!requestedLocationId) {
        return next(); // No location specified, let route handle it
    }

    if (!req.locationIds || req.locationIds.length === 0) {
        return res.status(403).json({
            success: false,
            message: 'No locations assigned to this user.'
        });
    }

    if (!req.locationIds.includes(requestedLocationId)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Location not assigned to this user.'
        });
    }

    next();
};

module.exports = {
    requireRole,
    attachLocationAccess,
    validateLocationAccess
};
