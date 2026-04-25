-- ====================================================
-- PAYMENT HISTORY TABLE
-- ====================================================

CREATE TABLE IF NOT EXISTS PAYMENT_HISTORY (
    payment_id SERIAL PRIMARY KEY,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id),
    subscription_id INTEGER REFERENCES LOCATION_SUBSCRIPTIONS(subscription_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    status VARCHAR(20) DEFAULT 'COMPLETED',
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_payment_location ON PAYMENT_HISTORY(location_id);
