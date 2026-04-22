
const LocationMaster = require('../models/LocationMaster');

/**
 * GET /api/location-master/cities?search=...&state=...
 * Search for cities, optionally filtered by state
 */
async function searchCities(req, res) {
    try {
        const { search = '', state = '' } = req.query;
        let cities;
        if (state) {
            cities = await LocationMaster.getCitiesByState(state, search);
        } else {
            cities = await LocationMaster.searchCities(search);
        }
        res.json({ success: true, data: cities });
    } catch (error) {
        console.error('Search cities error:', error);
        res.status(500).json({ success: false, message: 'Failed to search cities' });
    }
}

/**
 * GET /api/location-master/states
 * Get all states
 */
async function getAllStates(req, res) {
    try {
        const states = await LocationMaster.getAllStates();
        res.json({ success: true, data: states });
    } catch (error) {
        console.error('Get states error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch states' });
    }
}

/**
 * GET /api/location-master/pincodes?city=...&state=...
 * Get pincodes for a specific city and state
 */
async function getPincodes(req, res) {
    try {
        const { city, state } = req.query;
        if (!city || !state) {
            return res.status(400).json({ success: false, message: 'City and State are required' });
        }
        const pincodes = await LocationMaster.getPincodesByCityAndState(city, state);
        res.json({ success: true, data: pincodes });
    } catch (error) {
        console.error('Get pincodes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pincodes' });
    }
}

/**
 * GET /api/location-master/by-pincode/:pincode
 * Get city and state by pincode
 */
async function getLocationByPincode(req, res) {
    try {
        const { pincode } = req.params;
        const location = await LocationMaster.getLocationByPincode(pincode);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Pincode not found' });
        }
        res.json({ success: true, data: location });
    } catch (error) {
        console.error('Get location by pincode error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch location from pincode' });
    }
}

module.exports = {
    searchCities,
    getAllStates,
    getPincodes,
    getLocationByPincode
};
