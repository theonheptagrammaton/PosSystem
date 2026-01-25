const { pool } = require('../config/db');

// Get notifications for the current user/tenant
exports.getNotifications = async (req, res) => {
    try {
        const tenantId = req.user.tenantId || req.user.tenant_id;
        const userId = req.user.id || req.user.userId;
        const userRole = req.user.role;

        let query;
        let params;

        // If it's an admin, show EVERYTHING in the tenant
        if (userRole === 'admin') {
            query = `
                SELECT n.*, u.username as from_username, u.full_name as from_full_name
                FROM notifications n
                LEFT JOIN users u ON n.from_user_id = u.id
                WHERE n.tenant_id = $1 
                AND n.status != 'COMPLETED'
                ORDER BY n.created_at DESC
            `;
            params = [tenantId];
        } else if (userRole === 'waiter') {
            // Waiters see QR calls + direct calls to them
            query = `
                SELECT n.*, u.username as from_username, u.full_name as from_full_name
                FROM notifications n
                LEFT JOIN users u ON n.from_user_id = u.id
                WHERE n.tenant_id = $1 
                AND (n.to_user_id = $2 OR n.type = 'CALL_WAITER')
                AND n.status != 'COMPLETED'
                ORDER BY n.created_at DESC
            `;
            params = [tenantId, userId];
        } else {
            // Others only see direct calls
            query = `
                SELECT n.*, u.username as from_username, u.full_name as from_full_name
                FROM notifications n
                LEFT JOIN users u ON n.from_user_id = u.id
                WHERE n.tenant_id = $1 AND n.to_user_id = $2
                AND n.status != 'COMPLETED'
                ORDER BY n.created_at DESC
            `;
            params = [tenantId, userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'İç Sunucu Hatası' });
    }
};

// Create a new notification
exports.createNotification = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId || req.user?.tenant_id || req.body.tenant_id;
        const fromUserId = req.user?.id || req.user?.userId || null;
        const { to_user_id, table_no, message, type } = req.body;

        const result = await pool.query(
            `INSERT INTO notifications (tenant_id, from_user_id, to_user_id, table_no, message, type)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [tenantId, fromUserId, to_user_id || null, table_no || null, message, type]
        );

        const newNotification = result.rows[0];

        // Trigger socket event via app's io instance
        const io = req.app.get('io');
        if (io) {
            io.to(tenantId.toString()).emit('new_notification', newNotification);
        }

        res.status(201).json(newNotification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Bildirim oluşturulamadı' });
    }
};

// Update notification status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // COMPLETED or DEFERRED

        const result = await pool.query(
            'UPDATE notifications SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bildirim bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating notification status:', error);
        res.status(500).json({ error: 'Durum güncellenemedi' });
    }
};
