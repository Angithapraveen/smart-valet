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
        const locations = await Location.findAll();
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

module.exports = {
    createLocation,
    getLocations,
    updateLocationStatus
};
