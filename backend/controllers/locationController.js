const Location = require('../models/Location');
const { generateLocationId } = require('../services/locationService');

/**
 * POST /api/admin/locations
 * Create location (Admin only)
 */
async function createLocation(req, res) {
    try {
        const {
            location_name,
            location_short_code,
            location_type,
            address,
            valid_from,
            valid_to,
            total_capacity,
            status
        } = req.body;

        // Validation
        if (!location_name || !location_short_code || !location_type || !valid_from) {
            return res.status(400).json({
                success: false,
                message: 'location_name, location_short_code, location_type and valid_from are required.'
            });
        }

        const shortCode = String(location_short_code).trim().toUpperCase();
        if (shortCode.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Location short code must be exactly 3 characters.'
            });
        }

        const type = String(location_type).trim();
        const locationType = type || 'Other';

        const locationId = await generateLocationId(shortCode, locationType);

        const location = await Location.create({
            location_id: locationId,
            location_name: String(location_name).trim(),
            location_short_code: shortCode,
            location_type: locationType,
            address: address ? String(address).trim() : null,
            valid_from,
            valid_to: valid_to || null,
            total_capacity: total_capacity || 100,
            status: status !== false
        });

        return res.status(201).json({
            success: true,
            message: 'Location created successfully.',
            data: location
        });
    } catch (error) {
        console.error('Create location error:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Location ID already exists.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to create location.'
        });
    }
}

/**
 * GET /api/admin/locations
 * Get all locations (Admin only)
 */
async function getLocations(req, res) {
    try {
        const locations = await Location.findAllWithStats();
        return res.json({
            success: true,
            data: locations
        });
    } catch (error) {
        console.error('Get locations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch locations.'
        });
    }
}

/**
 * PUT /api/admin/locations/:id/status
 * Enable or disable location (Admin only)
 */
async function updateLocationStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'status (boolean) is required.'
            });
        }

        const location = await Location.updateStatus(id, status);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }

        return res.json({
            success: true,
            message: status ? 'Location enabled.' : 'Location disabled.',
            data: location
        });
    } catch (error) {
        console.error('Update location status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update location status.'
        });
    }
}

/**
 * GET /api/admin/locations/:id/owners
 * Get owners for a specific location (Admin only)
 */
async function getLocationOwners(req, res) {
    try {
        const { id } = req.params;
        const pool = require('../config/database');

        const query = `
            SELECT 
                u.user_id, u.name, u.email_id, u.phone_number, u.status, u.created_at
            FROM USERS u
            JOIN LOCATION_ACCESS la ON u.user_id = la.user_id
            JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
            WHERE la.location_id = $1 AND rm.role_name = 'OWNER'
            ORDER BY u.created_at DESC
        `;

        const result = await pool.query(query, [id]);

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get location owners error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch location owners.'
        });
    }
}

/**
 * PUT /api/admin/locations/:id
 * Update location details (Admin only)
 */
async function updateLocation(req, res) {
    try {
        const id = req.params.id || req.params.locationId;
        const {
            location_name,
            location_type,
            address,
            valid_from,
            valid_to,
            total_capacity,
            status
        } = req.body;

        // Validation
        if (!location_name || !location_type || !valid_from) {
            return res.status(400).json({
                success: false,
                message: 'location_name, location_type and valid_from are required.'
            });
        }

        const location = await Location.update(id, {
            location_name: String(location_name).trim(),
            location_type: String(location_type).trim(),
            address: address ? String(address).trim() : null,
            valid_from,
            valid_to: valid_to || null,
            total_capacity: total_capacity || 100,
            status: status !== false
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Location updated successfully.',
            data: location
        });
    } catch (error) {
        console.error('Update location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update location.'
        });
    }
}

module.exports = {
    createLocation,
    getLocations,
    updateLocationStatus,
    updateLocation,
    getLocationOwners
};
