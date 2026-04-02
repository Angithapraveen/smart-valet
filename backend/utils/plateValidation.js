/**
 * Indian Vehicle Plate Validation Utility
 */

const VALID_STATE_CODES = [
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA', 'GJ', 
    'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA', 'LD', 'MP', 'MH', 'MN', 'ML', 
    'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UA', 'UK', 
    'UP', 'WB'
];

/**
 * Validates a cleaned Indian license plate number
 * @param {string} plate - Uppercased, space-removed plate number
 * @returns {object} { isValid: boolean, error: string | null, type: 'STANDARD' | 'BH' | null }
 */
const validateIndianPlate = (plate) => {
    if (!plate || plate === 'N/A') return { isValid: true, error: null, type: null }; // Allow empty/N/A for compatibility

    // 1. Identify Type
    const isBH = /^[0-9]{2}BH/.test(plate);
    
    if (isBH) {
        // BH Format: YY BH 0000 AA
        const bhRegex = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
        const match = plate.match(bhRegex);
        
        if (!match) {
            return { 
                isValid: false, 
                error: 'Invalid BH Format. Example: 21BH1234AA', 
                type: 'BH' 
            };
        }
        return { isValid: true, error: null, type: 'BH' };
    } else {
        // Standard Format: SS 00 AA 0000
        const stdRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/;
        const match = plate.match(stdRegex);
        
        if (!match) {
            return { 
                isValid: false, 
                error: 'Incorrect structure. Example: TN01AB1234', 
                type: 'STANDARD' 
            };
        }

        const stateCode = plate.substring(0, 2);
        if (!VALID_STATE_CODES.includes(stateCode)) {
            return { 
                isValid: false, 
                error: `Invalid State Code: ${stateCode}`, 
                type: 'STANDARD' 
            };
        }

        return { isValid: true, error: null, type: 'STANDARD' };
    }
};

module.exports = {
    validateIndianPlate,
    VALID_STATE_CODES
};
