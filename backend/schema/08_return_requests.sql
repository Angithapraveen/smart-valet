-- ====================================================
-- RETURN_REQUESTS Table
-- Tracks return requests for parked vehicles
-- ====================================================

CREATE TABLE IF NOT EXISTS RETURN_REQUESTS (
    request_id SERIAL PRIMARY KEY,
    valet_id VARCHAR(20) NOT NULL REFERENCES VALET_TRANSACTIONS(valet_id) ON DELETE CASCADE,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id),
    accepted_driver_id VARCHAR(10) REFERENCES USERS(user_id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED')),
    requested_time TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_return_requests_valet ON RETURN_REQUESTS(valet_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_location ON RETURN_REQUESTS(location_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON RETURN_REQUESTS(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_driver ON RETURN_REQUESTS(accepted_driver_id);
