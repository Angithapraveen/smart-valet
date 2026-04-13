-- ====================================================
-- UPDATE DRIVER LOCATION ACCESS CONTROL
-- Adds status and partial unique index to LOCATION_ACCESS
-- ====================================================

DO $$ 
BEGIN 
    -- 1. Add status column with check constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_access' AND column_name = 'status') THEN
        ALTER TABLE LOCATION_ACCESS ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'));
    END IF;

    -- 2. Add audit columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_access' AND column_name = 'last_modified_by') THEN
        ALTER TABLE LOCATION_ACCESS ADD COLUMN last_modified_by VARCHAR(20) REFERENCES USERS(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_access' AND column_name = 'last_modified_at') THEN
        ALTER TABLE LOCATION_ACCESS ADD COLUMN last_modified_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- 3. Cleanup pre-existing records to satisfy the upcoming unique index:
    -- For each user, keep only the most recently assigned location as ACTIVE, mark others as INACTIVE.
    WITH ranked_access AS (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY assigned_at DESC) as r
        FROM LOCATION_ACCESS
        WHERE status = 'ACTIVE'
    )
    UPDATE LOCATION_ACCESS 
    SET status = 'INACTIVE'
    WHERE id IN (SELECT id FROM ranked_access WHERE r > 1);

    -- 4. Create Partial Unique Index to enforce "One Active Location per user"
    DROP INDEX IF EXISTS idx_one_active_location_per_user;
    CREATE UNIQUE INDEX idx_one_active_location_per_user ON LOCATION_ACCESS (user_id) WHERE (status = 'ACTIVE');

END $$;
