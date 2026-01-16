-- ============================================================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- Point of Sale System - Production Safe Migration
-- ============================================================================
-- CRITICAL: This script is designed to run on production with ZERO data loss
-- All changes use IF NOT EXISTS and conditional logic to prevent errors
-- ============================================================================

\echo '=========================================='
\echo 'Starting POS System Database Migration'
\echo 'Timestamp:' `date`
\echo '=========================================='

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- MIGRATION 001: Add branch_id to orders table
-- ============================================================================
\echo 'Migration 001: Adding branch_id to orders table...'

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='branch_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);
        RAISE NOTICE 'Added branch_id column to orders table';
    ELSE
        RAISE NOTICE 'branch_id column already exists, skipping...';
    END IF;
END $$;

-- Create index for performance (only if doesn't exist)
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);

-- Backfill existing orders with branch data (safe - only updates NULLs)
UPDATE orders o
SET branch_id = (
    SELECT MIN(b.id) 
    FROM branches b 
    WHERE b.tenant_id = o.tenant_id
)
WHERE branch_id IS NULL;

-- Make column NOT NULL (only if all rows have values)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM orders WHERE branch_id IS NULL) THEN
        ALTER TABLE orders ALTER COLUMN branch_id SET NOT NULL;
        RAISE NOTICE 'Set branch_id as NOT NULL';
    ELSE
        RAISE WARNING 'Some orders still have NULL branch_id, skipping NOT NULL constraint';
    END IF;
END $$;

\echo 'Migration 001: Complete ✓'

-- ============================================================================
-- MIGRATION 002: Add PREPARING status support
-- ============================================================================
\echo 'Migration 002: Adding PREPARING status support...'

-- Add column for tracking when preparation started
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='preparing_started_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN preparing_started_at TIMESTAMP;
        RAISE NOTICE 'Added preparing_started_at column to orders table';
    ELSE
        RAISE NOTICE 'preparing_started_at column already exists, skipping...';
    END IF;
END $$;

-- Add index for better query performance on preparing orders
CREATE INDEX IF NOT EXISTS idx_orders_preparing ON orders(status) WHERE status = 'PREPARING';

-- Add additional status index for kitchen queries
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(status) WHERE status = 'PENDING';

\echo 'Migration 002: Complete ✓'

-- ============================================================================
-- MIGRATION 003: Add indexes for performance optimization
-- ============================================================================
\echo 'Migration 003: Adding performance indexes...'

-- Index for tenant-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);

-- Composite index for table status queries (frequently used together)
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_no, status);

-- Index for time-based queries (reports)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Index for payment lookup
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id) WHERE payment_id IS NOT NULL;

-- Index for products by category (inventory queries)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE is_available = true;

\echo 'Migration 003: Complete ✓'

-- ============================================================================
-- MIGRATION 004: Data integrity constraints
-- ============================================================================
\echo 'Migration 004: Adding data integrity constraints...'

-- Add check constraint for non-negative prices (if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_price_check'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price >= 0);
        RAISE NOTICE 'Added price check constraint';
    END IF;
END $$;

-- Add check constraint for table count
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'branches_table_count_check'
    ) THEN
        ALTER TABLE branches ADD CONSTRAINT branches_table_count_check CHECK (table_count > 0 AND table_count <= 200);
        RAISE NOTICE 'Added table count check constraint';
    END IF;
END $$;

\echo 'Migration 004: Complete ✓'

-- ============================================================================
-- MIGRATION 005: Add audit fields (optional but recommended)
-- ============================================================================
\echo 'Migration 005: Adding audit fields...'

-- Add updated_at column to track modifications
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to orders table';
    END IF;
END $$;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

\echo 'Migration 005: Complete ✓'

-- ============================================================================
-- Verification Queries
-- ============================================================================
\echo '=========================================='
\echo 'Running verification checks...'
\echo '=========================================='

-- Check 1: Verify branch_id exists and has data
DO $$ 
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM orders WHERE branch_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING 'Found % orders with NULL branch_id', null_count;
    ELSE
        RAISE NOTICE 'All orders have branch_id ✓';
    END IF;
END $$;

-- Check 2: Verify indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_branch') THEN
        RAISE NOTICE 'Index idx_orders_branch exists ✓';
    ELSE
        RAISE WARNING 'Index idx_orders_branch missing!';
    END IF;
END $$;

-- Check 3: Show table structure
\echo 'Current orders table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Commit all changes
COMMIT;

\echo '=========================================='
\echo 'Migration Complete!'
\echo 'All changes applied successfully ✓'
\echo '=========================================='

-- ============================================================================
-- ROLLBACK PLAN (In case of emergency)
-- ============================================================================
-- If you need to rollback, run this in a separate transaction:
-- 
-- BEGIN;
-- ALTER TABLE orders DROP COLUMN IF EXISTS preparing_started_at;
-- ALTER TABLE orders DROP COLUMN IF EXISTS updated_at;
-- DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
-- DROP INDEX IF EXISTS idx_orders_preparing;
-- DROP INDEX IF EXISTS idx_orders_pending;
-- DROP INDEX IF EXISTS idx_orders_tenant;
-- DROP INDEX IF EXISTS idx_orders_table_status;
-- DROP INDEX IF EXISTS idx_orders_created_at;
-- -- NOTE: Do NOT drop branch_id if you have data - data loss risk!
-- COMMIT;
-- ============================================================================
