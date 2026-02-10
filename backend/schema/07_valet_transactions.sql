-- ====================================================
-- VALET_TRANSACTIONS Table
-- Main table for parking transactions
-- ====================================================

CREATE TABLE IF NOT EXISTS VALET_TRANSACTIONS (
    valet_id VARCHAR(20) PRIMARY KEY,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id),
    customer_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    car_model VARCHAR(50),
    car_category VARCHAR(20),
    status VARCHAR(30) NOT NULL DEFAULT 'PARKED' CHECK (status IN ('PARKED', 'RETURN_REQUESTED', 'READY', 'RETURNED', 'CANCELLED')),
    parked_driver_id VARCHAR(10) REFERENCES USERS(user_id),
    returned_driver_id VARCHAR(10) REFERENCES USERS(user_id),
    block_entry_id VARCHAR(12) REFERENCES BLOCK_ENTRIES(block_entry_id),
    parked_time TIMESTAMP,
    return_requested_time TIMESTAMP,
    ready_time TIMESTAMP,
    returned_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_valet_location ON VALET_TRANSACTIONS(location_id);
CREATE INDEX IF NOT EXISTS idx_valet_status ON VALET_TRANSACTIONS(status);
CREATE INDEX IF NOT EXISTS idx_valet_block_entry ON VALET_TRANSACTIONS(block_entry_id);
CREATE INDEX IF NOT EXISTS idx_valet_parked_driver ON VALET_TRANSACTIONS(parked_driver_id);
CREATE INDEX IF NOT EXISTS idx_valet_created ON VALET_TRANSACTIONS(created_at);
