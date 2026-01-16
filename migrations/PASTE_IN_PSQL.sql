-- ============================================================================
-- FINAL DATABASE MIGRATION - COPY PASTE READY
-- ============================================================================
-- Simply copy this entire file and paste into your psql terminal
-- No need to specify database name or username - you're already connected!
-- ============================================================================

\echo '=========================================='
\echo 'POS System - Production Migration'
\echo '=========================================='

BEGIN;

-- ============================================================================
-- 1. ADD BRANCH_ID TO ORDERS (if missing)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='branch_id') THEN
        ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);
        RAISE NOTICE '✓ Added branch_id column';
    ELSE
        RAISE NOTICE '⊙ branch_id already exists';
    END IF;
END $$;

-- Backfill existing data
UPDATE orders o
SET branch_id = (SELECT MIN(b.id) FROM branches b WHERE b.tenant_id = o.tenant_id)
WHERE branch_id IS NULL;

-- Make NOT NULL if all rows have values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM orders WHERE branch_id IS NULL) THEN
        ALTER TABLE orders ALTER COLUMN branch_id SET NOT NULL;
        RAISE NOTICE '✓ Set branch_id NOT NULL';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD PREPARING STATUS SUPPORT
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='preparing_started_at') THEN
        ALTER TABLE orders ADD COLUMN preparing_started_at TIMESTAMP;
        RAISE NOTICE '✓ Added preparing_started_at column';
    ELSE
        RAISE NOTICE '⊙ preparing_started_at already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_preparing ON orders(status) WHERE status = 'PREPARING';
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_no, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE is_available = true;

\echo '✓ Created performance indexes'

-- ============================================================================
-- 4. ADD DATA INTEGRITY CONSTRAINTS
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_check') THEN
        ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price >= 0);
        RAISE NOTICE '✓ Added price check constraint';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_table_count_check') THEN
        ALTER TABLE branches ADD CONSTRAINT branches_table_count_check CHECK (table_count > 0 AND table_count <= 200);
        RAISE NOTICE '✓ Added table count check constraint';
    END IF;
END $$;

-- ============================================================================
-- 5. ADD AUDIT FIELD (updated_at)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE '✓ Added updated_at column';
    END IF;
END $$;

-- Create auto-update trigger
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

\echo '✓ Created auto-update trigger'

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo '=========================================='
\echo 'Verification Checks:'
\echo '=========================================='

DO $$ 
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM orders WHERE branch_id IS NULL;
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Found % orders with NULL branch_id', null_count;
    ELSE
        RAISE NOTICE '✓ All orders have branch_id';
    END IF;
END $$;

COMMIT;

\echo '=========================================='
\echo '✓✓✓ Migration Complete! ✓✓✓'
\echo '=========================================='
