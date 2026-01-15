CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_no VARCHAR(50),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    items JSONB,
    source VARCHAR(20) DEFAULT 'POS', -- POS, QR, WAITER
    note TEXT,
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
-- Composite index for fetch tenant orders by date
CREATE INDEX idx_orders_tenant_date ON orders(tenant_id, created_at DESC);
