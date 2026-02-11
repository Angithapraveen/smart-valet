const pool = require('../config/database');

class Location {
    /**
     * Create a new location
     */
    static async create(locationData) {
        const {
            location_id,
            location_name,
            location_short_code,
            location_type,
            address,
            valid_from,
            valid_to,
            status
        } = locationData;

        const query = `
            INSERT INTO LOCATIONS (
                location_id, location_name, location_short_code, location_type,
                address, valid_from, valid_to, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await pool.query(query, [
            location_id,
            location_name,
            location_short_code,
            location_type,
            address || null,
            valid_from,
            valid_to || null,
            status !== false
        ]);
        return result.rows[0];
    }

    /**
     * Get all locations
     */
    static async findAll() {
        const query = `
            SELECT location_id, location_name, location_short_code, location_type,
                   address, valid_from, valid_to, status, created_at
            FROM LOCATIONS
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Get location by id
     */
    static async findById(locationId) {
        const query = 'SELECT * FROM LOCATIONS WHERE location_id = $1';
        const result = await pool.query(query, [locationId]);
        return result.rows[0] || null;
    }

    /**
     * Update location status
     */
    static async updateStatus(locationId, status) {
        const query = `
            UPDATE LOCATIONS SET status = $2 WHERE location_id = $1
            RETURNING location_id, location_name, location_type, status
        `;
        const result = await pool.query(query, [locationId, !!status]);
        return result.rows[0] || null;
    }

    /**
     * Check if location_id exists
     */
    static async exists(locationId) {
        const query = 'SELECT 1 FROM LOCATIONS WHERE location_id = $1';
        const result = await pool.query(query, [locationId]);
        return result.rows.length > 0;
    }
}

module.exports = Location;
