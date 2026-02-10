-- ====================================================
-- ROLE_MASTER Table
-- Stores all system roles: ADMIN, OWNER, MANAGER, DRIVER
-- ====================================================

CREATE TABLE IF NOT EXISTS ROLE_MASTER (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO ROLE_MASTER (role_name, description) VALUES
    ('ADMIN', 'System administrator with access to all locations'),
    ('OWNER', 'Location owner with access to multiple locations'),
    ('MANAGER', 'Location manager assigned to a single location'),
    ('DRIVER', 'Valet driver assigned to a single location')
ON CONFLICT (role_name) DO NOTHING;
