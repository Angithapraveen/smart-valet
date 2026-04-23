-- ====================================================
-- LOCATIONS Table - Update
-- Add city, state, and pincode columns to link with INDIA_LOCATION_MASTER
-- ====================================================

DO $$
BEGIN
    -- Add state column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'state') THEN
        ALTER TABLE LOCATIONS ADD COLUMN state VARCHAR(100);
    END IF;

    -- Add city column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'city') THEN
        ALTER TABLE LOCATIONS ADD COLUMN city VARCHAR(100);
    END IF;

    -- Add pincode column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'pincode') THEN
        ALTER TABLE LOCATIONS ADD COLUMN pincode VARCHAR(10);
    END IF;
END $$;
