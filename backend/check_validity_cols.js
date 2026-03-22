const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function check() {
    try {
        console.log('--- LOCATIONS ---');
        const locRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'locations'");
        console.log('Columns:', locRes.rows.map(r => r.column_name));

        console.log('\n--- BLOCKS ---');
        const blockRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'blocks'");
        console.log('Columns:', blockRes.rows.map(r => r.column_name));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
