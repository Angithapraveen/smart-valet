-- ====================================================
-- BLOCK_ENTRIES Table
-- Dynamic parking positions within blocks
-- ====================================================

CREATE TABLE IF NOT EXISTS BLOCK_ENTRIES (
    block_entry_id VARCHAR(12) PRIMARY KEY,
    block_id VARCHAR(10) NOT NULL REFERENCES BLOCKS(block_id) ON DELETE CASCADE,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster status queries
CREATE INDEX IF NOT EXISTS idx_block_entries_block ON BLOCK_ENTRIES(block_id);
CREATE INDEX IF NOT EXISTS idx_block_entries_location ON BLOCK_ENTRIES(location_id);
CREATE INDEX IF NOT EXISTS idx_block_entries_status ON BLOCK_ENTRIES(status);
