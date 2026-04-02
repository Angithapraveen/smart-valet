const pool = require('../config/database');

/**
 * Get all unique car brands
 */
const getBrands = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT Brand as brand FROM CarMaster ORDER BY brand ASC');
        res.json({
            success: true,
            data: result.rows.map(row => row.brand)
        });
    } catch (error) {
        console.error('Get Brands Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch brands.' });
    }
};

/**
 * Get all models for a specific brand
 */
const getModelsByBrand = async (req, res) => {
    try {
        const { brand } = req.params;
        const result = await pool.query(
            'SELECT Model as model, Category as category, Tier as tier FROM CarMaster WHERE Brand = $1 ORDER BY model ASC',
            [brand]
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get Models Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch models.' });
    }
};

module.exports = {
    getBrands,
    getModelsByBrand
};
