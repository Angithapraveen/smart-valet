const pool = require('../config/database');

/**
 * Get current year suffix (e.g. 26 for 2026)
 */
function getYearSuffix() {
    return String(new Date().getFullYear()).slice(-2);
}

/**
 * Get next owner sequence for current year (resets per year)
 * Format: 0001, 0002, ...
 */
async function getNextOwnerSequence() {
    const year = getYearSuffix();
    const query = `
        SELECT user_id FROM USERS
        WHERE user_id LIKE $1
        ORDER BY user_id DESC
        LIMIT 1
    `;
    const pattern = `OWN-${year}-%`;
    const result = await pool.query(query, [pattern]);
    if (result.rows.length === 0) return 1;
    const lastId = result.rows[0].user_id;
    const match = lastId.match(/OWN-\d{2}-(\d+)$/);
    const lastSeq = match ? parseInt(match[1], 10) : 0;
    return lastSeq + 1;
}

/**
 * Generate owner user_id
 * Format: OWN-YY-####
 * e.g. OWN-26-0001
 */
async function generateOwnerId() {
    const year = getYearSuffix();
    const seq = await getNextOwnerSequence();
    const sequencePart = String(seq).padStart(4, '0');
    return `OWN-${year}-${sequencePart}`;
}

/**
 * Get OWNER role_id from ROLE_MASTER
 */
async function getOwnerRoleId() {
    const query = 'SELECT role_id FROM ROLE_MASTER WHERE role_name = $1';
    const result = await pool.query(query, ['OWNER']);
    return result.rows[0]?.role_id || null;
}

module.exports = {
    getYearSuffix,
    getNextOwnerSequence,
    generateOwnerId,
    getOwnerRoleId
};
