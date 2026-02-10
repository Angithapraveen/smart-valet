-- ====================================================
-- Smart Valet Parking Management System
-- Database Initialization Script
-- ====================================================
-- Run this script to initialize the entire database
-- Execute schema files in order: 00_init.sql will run all others
-- ====================================================

-- Note: In PostgreSQL, you would typically run these files individually
-- or use a migration tool. This file serves as documentation of the order.

-- Execution order:
-- 1. 01_role_master.sql
-- 2. 02_users.sql
-- 3. 03_locations.sql
-- 4. 04_location_access.sql
-- 5. 05_blocks.sql
-- 6. 06_block_entries.sql
-- 7. 07_valet_transactions.sql
-- 8. 08_return_requests.sql
-- 9. 09_feedback.sql

-- To initialize the database:
-- psql -U postgres -d smart_valet -f backend/schema/01_role_master.sql
-- psql -U postgres -d smart_valet -f backend/schema/02_users.sql
-- ... (and so on for each file)
