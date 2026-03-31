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
                address, valid_from, valid_to, total_capacity, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
            locationData.total_capacity || 100,
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
     * Get all locations with statistics
     */
    static async findAllWithStats() {
        const query = `
            SELECT 
                l.location_id, l.location_name, l.location_short_code, l.location_type, l.address,
                (l.status AND l.valid_from <= CURRENT_DATE AND (l.valid_to IS NULL OR l.valid_to >= CURRENT_DATE)) as status,
                l.valid_from, l.valid_to, l.total_capacity,
                COALESCE(b.total_blocks, 0) as total_blocks,
                COALESCE(be.available_slots, 0) as available_slots,
                COALESCE(be.occupied_slots, 0) as occupied_slots,
                COALESCE(vt.active_parkings, 0) as active_parkings
            FROM LOCATIONS l
            LEFT JOIN (
                SELECT location_id, COUNT(*) as total_blocks 
                FROM BLOCKS 
                WHERE status = TRUE 
                AND valid_from <= CURRENT_DATE 
                AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
                GROUP BY location_id
            ) b ON l.location_id = b.location_id
            LEFT JOIN (
                SELECT 
                    location_id,
                    COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_slots,
                    COUNT(*) FILTER (WHERE status = 'OCCUPIED') as occupied_slots
                FROM BLOCK_ENTRIES 
                GROUP BY location_id
            ) be ON l.location_id = be.location_id
            LEFT JOIN (
                SELECT location_id, COUNT(*) as active_parkings 
                FROM VALET_TRANSACTIONS 
                WHERE status IN ('PARKED', 'RETURN_REQUESTED', 'READY')
                GROUP BY location_id
            ) vt ON l.location_id = vt.location_id
            ORDER BY l.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => ({
            ...row,
            total_blocks: parseInt(row.total_blocks),
            available_slots: parseInt(row.available_slots),
            occupied_slots: parseInt(row.occupied_slots),
            active_parkings: parseInt(row.active_parkings)
        }));
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
     * Update all location details
     */
    static async update(locationId, locationData) {
        const {
            location_name,
            location_type,
            address,
            valid_from,
            valid_to,
            status
        } = locationData;

        const query = `
            UPDATE LOCATIONS SET 
                location_name = $2,
                location_type = $3,
                address = $4,
                valid_from = $5,
                valid_to = $6,
                total_capacity = $7,
                status = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE location_id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [
            locationId,
            location_name,
            location_type,
            address || null,
            valid_from,
            valid_to || null,
            locationData.total_capacity || 100,
            status !== false
        ]);
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
