
const fs = require('fs');
const path = require('path');
const pool = require('../backend/config/database');

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, '../backend/db/init_location_master.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('--- Running Location Master Migration ---');
        await pool.query(sql);
        console.log('✅ Successfully created and seeded INDIA_LOCATION_MASTER table');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
