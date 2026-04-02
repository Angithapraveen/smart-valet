const express = require('express');
const router = express.Router();
const carMasterController = require('../controllers/carMasterController');

// GET /api/car-master/brands
router.get('/brands', carMasterController.getBrands);

// GET /api/car-master/models/:brand
router.get('/models/:brand', carMasterController.getModelsByBrand);

module.exports = router;
