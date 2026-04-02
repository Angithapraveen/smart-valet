-- ====================================================
-- Database Update Script: Key Management System
-- ====================================================

-- 1. Add total_capacity to LOCATIONS table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='locations' AND column_name='total_capacity') THEN
        ALTER TABLE LOCATIONS ADD COLUMN total_capacity INTEGER DEFAULT 100;
    END IF;
END $$;

-- 2. Add key_id to VALET_TRANSACTIONS table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='valet_transactions' AND column_name='key_id') THEN
        ALTER TABLE VALET_TRANSACTIONS ADD COLUMN key_id INTEGER;
    END IF;
END $$;

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_valet_key_id ON VALET_TRANSACTIONS(key_id);

-- Verify
SELECT 'Update successful' as Result;
