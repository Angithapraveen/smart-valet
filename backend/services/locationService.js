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
    // Search for any ID that matches any 3-char shortcode + current year suffix
    // ID format: XXXYYZZZ. We search for _ _ _ YY %
    const query = `
        SELECT location_id FROM LOCATIONS
        WHERE location_id LIKE $1
        ORDER BY location_id DESC
        LIMIT 1
    `;
    const pattern = `___${year}%`;
    const result = await pool.query(query, [pattern]);

    if (result.rows.length === 0) return 1;

    const lastId = result.rows[0].location_id;
    // Extract last 3 digits
    const seqPart = lastId.slice(-3);
    const lastSeq = parseInt(seqPart, 10);

    return isNaN(lastSeq) ? 1 : lastSeq + 1;
}

/**
 * Generate location_id
 * Format: XXXYYZZZ
 * e.g. DEL26001 (DEL=Shortcode, 26=Year, 001=Sequence)
 */
async function generateLocationId(shortCode) {
    const code = String(shortCode).trim().toUpperCase().slice(0, 3);
    const year = getYearSuffix();
    const seq = await getNextLocationSequence();
    const sequencePart = String(seq).padStart(3, '0');
    return `${code}${year}${sequencePart}`;
}

module.exports = {
    getYearSuffix,
    getNextLocationSequence,
    generateLocationId
};
