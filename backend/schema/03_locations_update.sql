-- ====================================================
-- LOCATIONS Table - Update for Admin Location Management
-- Add location_short_code, enforce valid_from NOT NULL
-- Run this if table already exists; otherwise use 03_locations.sql
-- ====================================================

-- Add location_short_code if not exists (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'location_short_code'
  ) THEN
    ALTER TABLE LOCATIONS ADD COLUMN location_short_code VARCHAR(3);
    UPDATE LOCATIONS SET location_short_code = UPPER(LEFT(location_id, 3)) WHERE location_short_code IS NULL;
    ALTER TABLE LOCATIONS ALTER COLUMN location_short_code SET NOT NULL;
  END IF;
END $$;

-- Ensure valid_from is NOT NULL (set default for existing NULLs first)
UPDATE LOCATIONS SET valid_from = CURRENT_DATE WHERE valid_from IS NULL;
ALTER TABLE LOCATIONS ALTER COLUMN valid_from SET NOT NULL;

-- Unique constraint on short_code + type + year for sequence consistency (optional)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_short_code ON LOCATIONS(location_short_code);
