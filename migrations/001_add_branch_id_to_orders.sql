-- Migration: Add branch_id to orders table
-- This field was missing but referenced throughout the codebase

ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);

-- Update existing orders to link to branch (if possible via tenant)
-- Note: This assumes single branch per tenant for existing data
UPDATE orders o
SET branch_id = (
    SELECT MIN(b.id) 
    FROM branches b 
    WHERE b.tenant_id = o.tenant_id
)
WHERE branch_id IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE orders ALTER COLUMN branch_id SET NOT NULL;
