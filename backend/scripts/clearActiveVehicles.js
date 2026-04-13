const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');


async function clearActiveVehicles() {
    console.log('🚀 Starting batch update: Setting all active vehicles to RETURNED status...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Identify active transactions that have block assignments
        const activeTxnsResult = await client.query(`
            SELECT block_entry_id FROM VALET_TRANSACTIONS 
            WHERE status NOT IN ('RETURNED', 'CANCELLED') AND block_entry_id IS NOT NULL
        `);
        
        const blockEntryIds = activeTxnsResult.rows.map(row => row.block_entry_id);
        
        if (blockEntryIds.length > 0) {
            console.log(`📦 Found ${blockEntryIds.length} blocks to free up.`);
            // 2. Free up the blocks
            await client.query(`
                UPDATE BLOCK_ENTRIES 
                SET status = 'AVAILABLE' 
                WHERE block_entry_id = ANY($1)
            `, [blockEntryIds]);
            console.log('✅ Blocks updated to AVAILABLE.');
        } else {
            console.log('ℹ️ No occupied blocks found.');
        }

        // 3. Update all active transactions to RETURNED
        const updateResult = await client.query(`
            UPDATE VALET_TRANSACTIONS 
            SET status = 'RETURNED', 
                returned_time = NOW() 
            WHERE status NOT IN ('RETURNED', 'CANCELLED')
            RETURNING valet_id
        `);

        console.log(`✅ ${updateResult.rowCount} transactions updated to RETURNED status.`);

        await client.query('COMMIT');
        console.log('🎉 Batch update completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during batch update:', error);
    } finally {
        client.release();
        process.exit();
    }
}

clearActiveVehicles();
