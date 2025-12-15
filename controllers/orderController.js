const { pool } = require('../config/db');

// --- Create Order (Append Item) ---
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

    // 2. Emit Socket Event (Notify POS/Kitchen)
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

// --- Get Aggregated Table Orders ---
const getTableOrders = async (req, res) => {
  const { tenantId, tableNo } = req.params; // Make sure these match route params

  try {
    const query = `
        SELECT * FROM orders 
        WHERE tenant_id = $1 AND table_no = $2 AND status = 'PENDING'
        ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [tenantId, tableNo]);
    
    // Aggregation Logic
    let aggregatedItems = [];
    let totalAmount = 0;

    result.rows.forEach(row => {
        const items = row.items; // JSONB is auto-parsed by pg
        // Merge items (simple append for now, could be smarter)
        if (Array.isArray(items)) {
            aggregatedItems = [...aggregatedItems, ...items];
        }
        totalAmount += parseFloat(row.total_amount);
    });

    res.json({
        table_no: tableNo,
        items: aggregatedItems,
        total_amount: totalAmount,
        order_count: result.rowCount
    });

  } catch (error) {
      console.error('Error fetching table orders:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Close Table (Payment) ---
const closeTable = async (req, res) => {
    const { tenantId, tableNo } = req.params;
    const io = req.app.get('io');
  
    try {
      const query = `
          UPDATE orders 
          SET status = 'COMPLETED', updated_at = NOW()
          WHERE tenant_id = $1 AND table_no = $2 AND status = 'PENDING'
          RETURNING *
      `;
      const result = await pool.query(query, [tenantId, tableNo]);
  
      if (io) {
          io.to(String(tenantId)).emit('table_closed', {
              table_no: tableNo,
              timestamp: new Date()
          });
      }
  
      res.json({ message: 'Table closed successfully', closed_orders: result.rowCount });
  
    } catch (error) {
        console.error('Error closing table:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports = {
  createOrder,
  getTableOrders,
  closeTable
};
