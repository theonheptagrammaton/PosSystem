-- Migration 002: Add PREPARING status to kitchen workflow
-- This adds an intermediate status between PENDING and READY

-- First, add new enum value if using enum (if not using enum, this is safe to skip)
-- Note: PostgreSQL doesn't allow ALTER TYPE easily, so we'll just ensure our code handles it

-- Add new column for tracking when order preparation started
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_started_at TIMESTAMP;

-- Add index for better query performance on preparing orders
CREATE INDEX IF NOT EXISTS idx_orders_preparing ON orders(status) WHERE status = 'PREPARING';

-- Update any existing PENDING orders that have been in system for >5 minutes to PREPARING
-- (This is optional - only if you want to backfill existing orders)
-- UPDATE orders 
-- SET status = 'PREPARING', preparing_started_at = created_at 
-- WHERE status = 'PENDING' 
-- AND created_at < NOW() - INTERVAL '5 minutes'
-- AND table_no IS NOT NULL;

-- Note: We don't need to alter the status column type because we're using VARCHAR/TEXT
-- The application code will handle the new 'PREPARING' status value
