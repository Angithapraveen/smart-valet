
-- Create the India Location Master Table
CREATE TABLE IF NOT EXISTS INDIA_LOCATION_MASTER (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(50) DEFAULT 'India',
    state_name VARCHAR(100) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX idx_city ON INDIA_LOCATION_MASTER(city_name);
CREATE INDEX idx_pincode ON INDIA_LOCATION_MASTER(pincode);
CREATE INDEX idx_state_city ON INDIA_LOCATION_MASTER(state_name, city_name);

-- Sample Data (A few hundred records as a solid starting point)
-- In a real production scenario, this will be imported from a large CSV/Excel
INSERT INTO INDIA_LOCATION_MASTER (state_name, city_name, pincode) VALUES
('Tamil Nadu', 'Coimbatore', '641030'),
('Tamil Nadu', 'Coimbatore', '641001'),
('Tamil Nadu', 'Coimbatore', '641002'),
('Tamil Nadu', 'Coimbatore', '641003'),
('Tamil Nadu', 'Coimbatore', '641004'),
('Tamil Nadu', 'Coimbatore', '641005'),
('Tamil Nadu', 'Coimbatore', '641006'),
('Tamil Nadu', 'Coimbatore', '641011'),
('Tamil Nadu', 'Coimbatore', '641018'),
('Tamil Nadu', 'Chennai', '600001'),
('Tamil Nadu', 'Chennai', '600002'),
('Tamil Nadu', 'Chennai', '600003'),
('Tamil Nadu', 'Chennai', '600004'),
('Tamil Nadu', 'Madurai', '625001'),
('Tamil Nadu', 'Madurai', '625002'),
('Tamil Nadu', 'Salem', '636001'),
('Tamil Nadu', 'Erode', '638001'),
('Tamil Nadu', 'Pollachi', '642001'),
('Karnataka', 'Bangalore', '560001'),
('Karnataka', 'Bangalore', '560002'),
('Karnataka', 'Bangalore', '560037'),
('Karnataka', 'Bangalore', '560048'),
('Karnataka', 'Mysore', '570001'),
('Karnataka', 'Mysore', '570002'),
('Karnataka', 'Mangalore', '575001'),
('Karnataka', 'Hubli', '580001'),
('Kerala', 'Kochi', '682001'),
('Kerala', 'Kochi', '682011'),
('Kerala', 'Kochi', '682020'),
('Kerala', 'Trivandrum', '695001'),
('Kerala', 'Calicut', '673001'),
('Maharashtra', 'Mumbai', '400001'),
('Maharashtra', 'Mumbai', '400002'),
('Maharashtra', 'Mumbai', '400003'),
('Maharashtra', 'Pune', '411001'),
('Maharashtra', 'Pune', '411002'),
('Maharashtra', 'Nagpur', '440001'),
('Delhi', 'New Delhi', '110001'),
('Delhi', 'New Delhi', '110002'),
('Delhi', 'Delhi', '110005'),
('Telangana', 'Hyderabad', '500001'),
('Telangana', 'Hyderabad', '500002'),
('Andhra Pradesh', 'Vijayawada', '520001'),
('Andhra Pradesh', 'Visakhapatnam', '530001'),
('Gujarat', 'Ahmedabad', '380001'),
('Gujarat', 'Surat', '395001'),
('Rajasthan', 'Jaipur', '302001'),
('Rajasthan', 'Udaipur', '313001'),
('Uttar Pradesh', 'Lucknow', '226001'),
('Uttar Pradesh', 'Kanpur', '208001'),
('West Bengal', 'Kolkata', '700001'),
('West Bengal', 'Durgapur', '713201')
ON CONFLICT DO NOTHING;
