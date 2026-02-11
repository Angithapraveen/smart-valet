-- ====================================================
-- LOCATIONS Table
-- Stores all parking locations
-- ====================================================

CREATE TABLE IF NOT EXISTS LOCATIONS (
    location_id VARCHAR(12) PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL,
    location_short_code VARCHAR(3) NOT NULL,
    location_type VARCHAR(20) NOT NULL,
    address TEXT,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for filtering active locations
CREATE INDEX IF NOT EXISTS idx_locations_status ON LOCATIONS(status);
