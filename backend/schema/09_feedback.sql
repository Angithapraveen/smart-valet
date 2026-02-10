-- ====================================================
-- FEEDBACK Table
-- Stores customer feedback and ratings
-- ====================================================

CREATE TABLE IF NOT EXISTS FEEDBACK (
    feedback_id SERIAL PRIMARY KEY,
    valet_id VARCHAR(20) NOT NULL REFERENCES VALET_TRANSACTIONS(valet_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on valet_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_valet ON FEEDBACK(valet_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON FEEDBACK(rating);
