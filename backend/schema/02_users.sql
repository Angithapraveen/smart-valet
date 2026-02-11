-- ====================================================
-- USERS Table
-- Stores all system users with their roles
-- ====================================================

CREATE TABLE IF NOT EXISTS USERS (
    user_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES ROLE_MASTER(role_id),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email and phone for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON USERS(email_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON USERS(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON USERS(role_id);
