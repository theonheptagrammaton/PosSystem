-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Can be NULL for QR menu notifications
    to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Can be NULL for general (e.g. to all waiters)
    table_no VARCHAR(20), -- For QR menu calls
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, DEFERRED
    type VARCHAR(20) NOT NULL, -- CALL_WAITER, USER_CALL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_to_user ON notifications(to_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
