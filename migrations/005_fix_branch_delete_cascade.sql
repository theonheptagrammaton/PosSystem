-- Fix for: "null value in column branch_id of relation orders violates not-null constraint"
-- This error happens because the foreign key is trying to set branch_id (which is NOT NULL) to NULL on delete.
-- We want to CASCADE delete orders when a branch is deleted.

-- 1. Drop the existing foreign key constraint (Check name, usually orders_branch_id_fkey)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_branch_id_fkey;

-- 2. Add the correct foreign key with ON DELETE CASCADE
ALTER TABLE orders 
    ADD CONSTRAINT orders_branch_id_fkey 
    FOREIGN KEY (branch_id) 
    REFERENCES branches(id) 
    ON DELETE CASCADE;
