// Kitchen Preparing Endpoint
// Add this function to orderController.js around line 400

const startPreparing = async (req, res) => {
    const { orderId } = req.params;
    const io = req.app.get('io');

    try {
        const result = await pool.query(
            "UPDATE orders SET status = 'PREPARING', preparing_started_at = NOW() WHERE id = $1 RETURNING *",
            [orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = result.rows[0];

        // Notify all connected clients
        if (io) {
            io.to(String(order.tenant_id)).emit('new_order', {
                ...order,
                status: 'PREPARING'
            });
        }

        res.json(order);
    } catch (error) {
        console.error('Start Preparing error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Then add to module.exports:
// startPreparing,
