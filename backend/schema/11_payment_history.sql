-- ====================================================
-- PAYMENT HISTORY TABLE
-- ====================================================

CREATE TABLE IF NOT EXISTS PAYMENT_HISTORY (
    payment_id SERIAL PRIMARY KEY,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id),
    plan_id INTEGER REFERENCES PAYMENT_PLANS(plan_id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    payment_date TIMESTAMP DEFAULT NOW(),
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_payment_location ON PAYMENT_HISTORY(location_id);
