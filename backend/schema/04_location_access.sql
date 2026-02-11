-- ====================================================
-- LOCATION_ACCESS Table
-- Generic user-location mapping for role-based access
-- ====================================================

CREATE TABLE IF NOT EXISTS LOCATION_ACCESS (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE,
    location_id VARCHAR(20) NOT NULL REFERENCES LOCATIONS(location_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_access_user ON LOCATION_ACCESS(user_id);
CREATE INDEX IF NOT EXISTS idx_location_access_location ON LOCATION_ACCESS(location_id);
