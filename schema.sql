-- Enable UUID extension if needed (optional, but good practice for IDs, though requirement didn't specify UUIDs, using SERIAL/INTEGER is standard unless requested otherwise. sticking to standard SERIAL for IDs based on typical simple setups unless implied otherwise. The prompt says "id", usually implies auto inc).
-- However, for multi-tenant SaaS, UUIDs are often better. But I'll stick to standard simpler SERIAL or INTEGER unless I see reasons otherwise. Let's use SERIAL for simplicity as requested "id".

-- Create Enum Type for User Roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier');

-- Tenants Table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    password TEXT NOT NULL, -- Storing plain text as requested (NOT RECOMMENDED for production security, but following requirements)
    role user_role NOT NULL,
    is_onboarded BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, username)
);

-- Branches Table
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
