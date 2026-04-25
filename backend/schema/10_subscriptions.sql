-- ====================================================
-- SUBSCRIPTION SYSTEM TABLES
-- ====================================================

-- 1. Payment Plans Table
CREATE TABLE IF NOT EXISTS PAYMENT_PLANS (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    total_transactions INTEGER NOT NULL,
    duration_months INTEGER NOT NULL, -- e.g., 1, 3, 6, 12
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'expired')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Location Subscriptions Table
CREATE TABLE IF NOT EXISTS LOCATION_SUBSCRIPTIONS (
    subscription_id SERIAL PRIMARY KEY,
    location_id VARCHAR(12) NOT NULL REFERENCES LOCATIONS(location_id),
    plan_id INTEGER NOT NULL REFERENCES PAYMENT_PLANS(plan_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'BLOCKED')),
    remaining_transactions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_subscription_location ON LOCATION_SUBSCRIPTIONS(location_id, status);

-- Seed some default plans if none exist
INSERT INTO PAYMENT_PLANS (plan_name, total_transactions, duration_months, price)
SELECT 'Basic Plan', 500, 1, 999.00
WHERE NOT EXISTS (SELECT 1 FROM PAYMENT_PLANS WHERE plan_name = 'Basic Plan');

INSERT INTO PAYMENT_PLANS (plan_name, total_transactions, duration_months, price)
SELECT 'Standard Plan', 2000, 3, 2499.00
WHERE NOT EXISTS (SELECT 1 FROM PAYMENT_PLANS WHERE plan_name = 'Standard Plan');

INSERT INTO PAYMENT_PLANS (plan_name, total_transactions, duration_months, price)
SELECT 'Premium Plan', 5000, 6, 4499.00
WHERE NOT EXISTS (SELECT 1 FROM PAYMENT_PLANS WHERE plan_name = 'Premium Plan');

INSERT INTO PAYMENT_PLANS (plan_name, total_transactions, duration_months, price)
SELECT 'Enterprise Plan', 15000, 12, 7999.00
WHERE NOT EXISTS (SELECT 1 FROM PAYMENT_PLANS WHERE plan_name = 'Enterprise Plan');
