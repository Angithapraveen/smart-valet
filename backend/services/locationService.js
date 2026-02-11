const pool = require('../config/database');

/**
 * Get first letter of location type for ID generation
 * Mall -> M, Hotel -> H, Other -> O (or first letter of custom type)
 */
function getTypeLetter(locationType) {
    if (!locationType) return 'O';
    const upper = String(locationType).trim().toUpperCase();
    if (upper === 'MALL') return 'M';
    if (upper === 'HOTEL') return 'H';
    if (upper === 'OTHER') return 'O';
    return upper.charAt(0) || 'O';
}

/**
 * Get current year suffix (e.g. 26 for 2026)
 */
function getYearSuffix() {
    return String(new Date().getFullYear()).slice(-2);
}

/**
 * Get next location sequence for current year (resets per year)
 * Format: 001, 002, ... (global per year)
 */
async function getNextLocationSequence() {
    const year = getYearSuffix();
    const query = `
        SELECT location_id FROM LOCATIONS
        WHERE location_id LIKE $1
        ORDER BY location_id DESC
        LIMIT 1
    `;
    const pattern = `%-%${year}-%`;
    const result = await pool.query(query, [pattern]);
    if (result.rows.length === 0) return 1;
    const lastId = result.rows[0].location_id;
    const match = lastId.match(/-(\d{3})$/);
    const lastSeq = match ? parseInt(match[1], 10) : 0;
    return lastSeq + 1;
}

/**
 * Generate location_id
 * Format: [SHORTCODE]-[TYPE][YY]-[SEQUENCE]
 * e.g. ABC-M26-001
 */
async function generateLocationId(shortCode, locationType) {
    const code = String(shortCode).trim().toUpperCase().slice(0, 3);
    const letter = getTypeLetter(locationType);
    const year = getYearSuffix();
    const seq = await getNextLocationSequence();
    const sequencePart = String(seq).padStart(3, '0');
    return `${code}-${letter}${year}-${sequencePart}`;
}

module.exports = {
    getTypeLetter,
    getYearSuffix,
    getNextLocationSequence,
    generateLocationId
};
