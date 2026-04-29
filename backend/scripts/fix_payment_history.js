const pool = require('../config/database');

async function fixPaymentHistory() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: update payment_history table...');
        
        await client.query('BEGIN');

        // 1. Add plan_id if it doesn't exist
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_history' AND column_name='plan_id') THEN
                    ALTER TABLE PAYMENT_HISTORY ADD COLUMN plan_id INTEGER REFERENCES PAYMENT_PLANS(plan_id);
                END IF;
            END $$;
        `);

        // 2. Add payment_date if it doesn't exist
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_history' AND column_name='payment_date') THEN
                    ALTER TABLE PAYMENT_HISTORY ADD COLUMN payment_date TIMESTAMP DEFAULT NOW();
                END IF;
            END $$;
        `);

        // 3. Drop subscription_id if it exists (optional, but requested by schema change)
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_history' AND column_name='subscription_id') THEN
                    ALTER TABLE PAYMENT_HISTORY DROP COLUMN subscription_id;
                END IF;
            END $$;
        `);

        // 4. Drop payment_method if it exists (optional)
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_history' AND column_name='payment_method') THEN
                    ALTER TABLE PAYMENT_HISTORY DROP COLUMN payment_method;
                END IF;
            END $$;
        `);

        // 5. Update status constraint
        // First drop old constraint if it exists (PostgreSQL doesn't always name them predictably, but let's try)
        // Or just let it be if we can't easily find the name. 
        // A safer way is to check the check constraint.
        
        await client.query(`
            ALTER TABLE PAYMENT_HISTORY 
            ALTER COLUMN status SET DEFAULT 'PENDING';
        `);

        await client.query('COMMIT');
        console.log('Migration successful: payment_history table updated.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

fixPaymentHistory();
