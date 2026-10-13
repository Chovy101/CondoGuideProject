-- Migration: 001_add_unique_user_condo_review.sql
-- Goal: Enforce "1 user per condo per review" rule safely without breaking existing data.
-- -------------------------------------------------------------------------------------------

-- Step 1: Safely delete any older duplicate reviews for the same user and condo, keeping the latest review (highest id)
DELETE r1 FROM reviews r1
INNER JOIN reviews r2 
WHERE r1.id < r2.id 
  AND r1.user_id = r2.user_id 
  AND r1.condo_id = r2.condo_id;

-- Step 2: Add unique index/constraint to reviews table
-- Note: If running on MySQL 8.0 / MariaDB, adding the constraint will now succeed cleanly
ALTER TABLE reviews
ADD CONSTRAINT uq_user_condo_review UNIQUE (user_id, condo_id);
