const pool = require('../config/database');

/**
 * Generate Valet Ticket ID
 * Format: {LOCATION_ID}-YYYYMMDD-####
 */
const generateValetId = async (locationId) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `${locationId}-${dateStr}`;

    try {
        // Find latest ticket for this location and date
        const query = `
            SELECT valet_id FROM VALET_TRANSACTIONS 
            WHERE valet_id LIKE $1 
            ORDER BY valet_id DESC 
            LIMIT 1
        `;
        const result = await pool.query(query, [`${prefix}%`]);

        let nextNum = 1;
        if (result.rows.length > 0) {
            const lastId = result.rows[0].valet_id;
            const lastNum = parseInt(lastId.split('-').pop(), 10);
            nextNum = lastNum + 1;
        }

        const nextNumStr = nextNum.toString().padStart(4, '0');
        return `${prefix}-${nextNumStr}`;
    } catch (error) {
        console.error('Error generating Valet ID:', error);
        throw error;
    }
};

/**
 * Handle WhatsApp Transaction
 * POST /api/valet/whatsapp
 * Expects: { location_id, driver_id }
 * (In a real scenario, this would parse a webhook payload)
 */
const createWhatsAppTransaction = async (req, res) => {
    const { location_id, driver_id, customer_name, phone_number, car_model } = req.body;

    if (!location_id || !driver_id) {
        return res.status(400).json({
            success: false,
            message: 'Location ID and Driver ID are required.'
        });
    }

    try {
        const valetId = await generateValetId(location_id);

        const insertQuery = `
            INSERT INTO VALET_TRANSACTIONS 
            (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_model, status, parked_time)
            VALUES ($1, $2, $3, $4, $5, $6, 'PARKED', NOW())
            RETURNING *
        `;

        const values = [
            valetId,
            location_id,
            driver_id,
            customer_name || 'WhatsApp Guest',
            phone_number || 'N/A',
            car_model || 'Unknown'
        ];

        const result = await pool.query(insertQuery, values);

        res.json({
            success: true,
            valet_id: valetId,
            message: 'Car parked successfully.',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('WhatsApp Transaction Error FULL:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            table: error.table,
            column: error.column,
            constraint: error.constraint
        });

        res.status(500).json({
            success: false,
            message: error.message
        });
    }

};

/**
 * Get Valet Vehicles for Dashboard
 * GET /api/valet/vehicles?location_id=LOC-123
 */
const getValetVehicles = async (req, res) => {
    try {
        const { location_id } = req.query;

        if (!location_id) {
            return res.status(400).json({
                success: false,
                message: 'Location ID is required.'
            });
        }

        // Fetch vehicles that are currently active (PARKED, RETURN_REQUESTED, READY)
        // We might also want to show recently RETURNED ones, but for now focus on active
        const query = `
            SELECT * FROM VALET_TRANSACTIONS 
            WHERE location_id = $1 
            AND status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
            ORDER BY 
                CASE status 
                    WHEN 'RETURN_REQUESTED' THEN 1 
                    WHEN 'READY' THEN 2 
                    WHEN 'PARKED' THEN 3 
                    ELSE 4 
                END,
                created_at DESC
        `;

        const result = await pool.query(query, [location_id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get Valet Vehicles Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles.'
        });
    }
};



/**
 * Get Single Valet Transaction Details
 * GET /api/valet/:valetId
 */
const getValetTransactionDetails = async (req, res) => {
    try {
        const { valetId } = req.params;

        const query = `
            SELECT * FROM VALET_TRANSACTIONS 
            WHERE valet_id = $1
        `;

        const result = await pool.query(query, [valetId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get Transaction Details Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction details.'
        });
    }
};

/**
 * Update Vehicle Details
 * PUT /api/valet/:valetId
 */
const updateVehicleDetails = async (req, res) => {
    const { valetId } = req.params;
    const { car_model, car_category } = req.body;

    try {
        const result = await pool.query(
            `UPDATE VALET_TRANSACTIONS
             SET car_model = $1,
                 car_category = $2
             WHERE valet_id = $3
             RETURNING *`,
            [car_model, car_category, valetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vehicle details updated successfully.'
        });

    } catch (err) {
        console.error('Update Vehicle Details Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle details.'
        });
    }
};
module.exports = {
    createWhatsAppTransaction,
    getValetVehicles,
    getValetTransactionDetails,
    updateVehicleDetails
};