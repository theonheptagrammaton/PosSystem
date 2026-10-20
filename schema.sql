-- Base schema. Apply in order: schema.sql, schema_inventory.sql, schema_payments.sql, schema_orders.sql, migrations/COMPLETE_MIGRATION.sql

-- Create Enum Type for User Roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'branch_manager', 'cashier', 'waiter', 'kitchen');

-- Tenants Table
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Branches Table
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    table_count INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    password TEXT NOT NULL, -- bcrypt hash
    role user_role NOT NULL,
    is_onboarded BOOLEAN DEFAULT FALSE,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, username)
);

-- Performance Indexes (Added for Speed Optimization)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_users_tenant_username ON users(tenant_id, username);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    table_no VARCHAR(20),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_to_user ON notifications(to_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
