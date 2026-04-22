
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    searchCities,
    getAllStates,
    getPincodes,
    getLocationByPincode
} = require('../controllers/locationMasterController');

// Secure all location-master routes
router.use(authenticate);

router.get('/cities', searchCities);
router.get('/states', getAllStates);
router.get('/pincodes', getPincodes);
router.get('/by-pincode/:pincode', getLocationByPincode);

module.exports = router;
