const pool = require('../config/database');

/**
 * Generate Driver ID
 * Format: DRV-LOC-YYYYMM-####
 * Example: DRV-MCV-202602-0001
 */
const generateDriverId = async (locationShortCode) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    const prefix = `DRV-${locationShortCode}-${yearMonth}`;

    // Count existing drivers with this prefix
    const query = `
        SELECT COUNT(*) as count 
        FROM USERS 
        WHERE user_id LIKE $1
    `;
    const result = await pool.query(query, [`${prefix}-%`]);
    const count = parseInt(result.rows[0].count);

    const serial = String(count + 1).padStart(4, '0');
    return `${prefix}-${serial}`;
};

/**
 * Generate Manager ID
 * Format: MGR-LOC-YYYY-####
 * Example: MGR-MCV-2026-0001
 */
const generateManagerId = async (locationShortCode) => {
    const now = new Date();
    const year = now.getFullYear();

    const prefix = `MGR-${locationShortCode}-${year}`;

    // Count existing managers with this prefix
    const query = `
        SELECT COUNT(*) as count 
        FROM USERS 
        WHERE user_id LIKE $1
    `;
    const result = await pool.query(query, [`${prefix}-%`]);
    const count = parseInt(result.rows[0].count);

    const serial = String(count + 1).padStart(4, '0');
    return `${prefix}-${serial}`;
};

module.exports = {
    generateDriverId,
    generateManagerId
};
