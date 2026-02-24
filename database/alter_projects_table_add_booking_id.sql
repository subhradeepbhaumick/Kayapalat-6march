-- Add booking_id column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS booking_id VARCHAR(45) AFTER booking_status;
