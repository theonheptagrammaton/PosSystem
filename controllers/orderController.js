const { pool } = require('../config/db');

const createOrder = async (req, res) => {
  const { tenant_id, table_no, total_amount, items } = req.body;
  const io = req.app.get('io');

  if (!tenant_id || !total_amount) {
    return res.status(400).json({ error: 'Tenant ID and Total Amount are required' });
  }

  try {
    // 1. Save to Database
    const query = `
      INSERT INTO orders (tenant_id, table_no, total_amount, items, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;
    const values = [tenant_id, table_no, total_amount, JSON.stringify(items)];
    const result = await pool.query(query, values);
    const newOrder = result.rows[0];

    // 2. Emit Socket Event
    if (io) {
      io.to(String(tenant_id)).emit('new_order', {
        id: newOrder.id,
        table_no: newOrder.table_no,
        amount: newOrder.total_amount,
        items: newOrder.items,
        timestamp: newOrder.created_at
      });
      console.log(`Order ${newOrder.id} emitted to room ${tenant_id}`);
    } else {
      console.warn('Socket.io instance not found');
    }

    res.status(201).json(newOrder);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createOrder
};
