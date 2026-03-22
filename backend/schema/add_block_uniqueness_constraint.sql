-- Add unique constraint for block_name within a location
-- This prevents two blocks from having the same name in the same location
-- while allowing different locations to have blocks with same names.

-- First, check for any existing duplicates to avoid constraint failure
-- (Optional diagnostic query)
-- SELECT location_id, block_name, count(*) 
-- FROM BLOCKS 
-- GROUP BY location_id, block_name 
-- HAVING count(*) > 1;

ALTER TABLE BLOCKS
ADD CONSTRAINT unique_block_name_per_location UNIQUE (location_id, block_name);
