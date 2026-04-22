-- ====================================================
-- Increase user_id and driver_id column lengths
-- Current limit (10) is too short for generated IDs like OWN-26-0001
-- ====================================================

-- 1. USERS table
ALTER TABLE USERS ALTER COLUMN user_id TYPE VARCHAR(20);

-- 2. VALET_TRANSACTIONS table
ALTER TABLE VALET_TRANSACTIONS ALTER COLUMN parked_driver_id TYPE VARCHAR(20);
ALTER TABLE VALET_TRANSACTIONS ALTER COLUMN returned_driver_id TYPE VARCHAR(20);

-- 3. LOCATION_ACCESS table
ALTER TABLE LOCATION_ACCESS ALTER COLUMN user_id TYPE VARCHAR(20);

-- 4. RETURN_REQUESTS table
ALTER TABLE RETURN_REQUESTS ALTER COLUMN accepted_driver_id TYPE VARCHAR(20);
