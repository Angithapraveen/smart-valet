
const pool = require('../config/database');

class LocationMaster {
    /**
     * Search cities by name prefix
     */
    static async searchCities(search) {
        const query = `
            SELECT DISTINCT city_name, state_name 
            FROM INDIA_LOCATION_MASTER 
            WHERE city_name ILIKE $1 
            ORDER BY city_name ASC 
            LIMIT 20
        `;
        const values = [`${search}%`];
        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Get state name associated with a city
     */
    static async getStateByCity(city) {
        const query = `
            SELECT DISTINCT state_name 
            FROM INDIA_LOCATION_MASTER 
            WHERE city_name = $1 
            LIMIT 1
        `;
        const result = await pool.query(query, [city]);
        return result.rows[0];
    }

    /**
     * Get all pincodes for a city and state
     */
    static async getPincodesByCityAndState(city, state) {
        const query = `
            SELECT pincode 
            FROM INDIA_LOCATION_MASTER 
            WHERE city_name = $1 AND state_name = $2 
            ORDER BY pincode ASC
        `;
        const result = await pool.query(query, [city, state]);
        return result.rows.map(row => row.pincode);
    }

    /**
     * Get location details (city, state) based on pincode
     */
    static async getLocationByPincode(pincode) {
        const query = `
            SELECT city_name, state_name 
            FROM INDIA_LOCATION_MASTER 
            WHERE pincode = $1 
            LIMIT 1
        `;
        const result = await pool.query(query, [pincode]);
        return result.rows[0];
    }

    /**
     * Get all unique states
     */
    static async getAllStates() {
        const result = await pool.query('SELECT DISTINCT state_name FROM INDIA_LOCATION_MASTER ORDER BY state_name ASC');
        return result.rows.map(row => row.state_name);
    }

    /**
     * Filter cities by state
     */
    static async getCitiesByState(state, search = '') {
        const query = `
            SELECT DISTINCT city_name 
            FROM INDIA_LOCATION_MASTER 
            WHERE state_name = $1 AND city_name ILIKE $2 
            ORDER BY city_name ASC
        `;
        const result = await pool.query(query, [state, `${search}%`]);
        return result.rows.map(row => row.city_name);
    }
}

module.exports = LocationMaster;
