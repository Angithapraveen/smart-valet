-- ====================================================
-- BLOCKS Table
-- Stores parking blocks within locations
-- ====================================================

CREATE TABLE IF NOT EXISTS BLOCKS (
    block_id VARCHAR(10) PRIMARY KEY,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id) ON DELETE CASCADE,
    block_name VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 1),
    valid_from DATE,
    valid_to DATE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on location_id for faster queries
CREATE INDEX IF NOT EXISTS idx_blocks_location ON BLOCKS(location_id);
CREATE INDEX IF NOT EXISTS idx_blocks_status ON BLOCKS(status);
