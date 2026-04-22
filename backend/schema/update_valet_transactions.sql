-- ====================================================
-- VALET_TRANSACTIONS Table - Update
-- Add missing columns: key_slot, on_the_way_time, car_number
-- ====================================================

DO $$
BEGIN
    -- Add car_number if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valet_transactions' AND column_name = 'car_number') THEN
        ALTER TABLE VALET_TRANSACTIONS ADD COLUMN car_number VARCHAR(20);
    END IF;

    -- Add on_the_way_time if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valet_transactions' AND column_name = 'on_the_way_time') THEN
        ALTER TABLE VALET_TRANSACTIONS ADD COLUMN on_the_way_time TIMESTAMP;
    END IF;

    -- Add key_slot if not exists (handling key_id -> key_slot transition if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valet_transactions' AND column_name = 'key_slot') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valet_transactions' AND column_name = 'key_id') THEN
            ALTER TABLE VALET_TRANSACTIONS RENAME COLUMN key_id TO key_slot;
        ELSE
            ALTER TABLE VALET_TRANSACTIONS ADD COLUMN key_slot INTEGER;
        END IF;
    END IF;
END $$;
