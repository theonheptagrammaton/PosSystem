const { pool } = require('../config/db');

// --- Create Order (Append Item) ---
const createOrder = async (req, res) => {
  const { tenant_id, branch_id, table_no, total_amount, items, status } = req.body;
  const io = req.app.get('io');

  if (!tenant_id || !total_amount) {
    return res.status(400).json({ error: 'Tenant ID and Total Amount are required' });
  }

  try {
    // 1. Save to Database
    // Default status is now WAITING_APPROVAL if not specified (e.g. from QR Menu)
    // POS should send 'PENDING' for immediate active status
    const initialStatus = status || 'WAITING_APPROVAL';

    const query = `
      INSERT INTO orders (tenant_id, branch_id, table_no, total_amount, items, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [tenant_id, branch_id, table_no, total_amount, JSON.stringify(items), initialStatus];
    const result = await pool.query(query, values);
    const newOrder = result.rows[0];

    // 2. Emit Socket Event (Notify POS/Kitchen)
    if (io) {
      io.to(String(tenant_id)).emit('new_order', {
        id: newOrder.id,
        table_no: newOrder.table_no,
        amount: newOrder.total_amount,
        items: newOrder.items,
        timestamp: newOrder.created_at,
        branch_id: branch_id,
        status: newOrder.status // Emit status so client knows to play sound or just refresh
      });
      console.log(`Order ${newOrder.id} emitted to room ${tenant_id} with status ${newOrder.status}`);
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
  const { tenantId, branchId, tableNo } = req.params; 

  try {
    const query = `
        SELECT * FROM orders 
        WHERE tenant_id = $1 AND branch_id = $2 AND table_no = $3 AND status = 'PENDING'
        ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [tenantId, branchId, tableNo]);
    
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
    const { tenantId, branchId, tableNo } = req.params;
    const io = req.app.get('io');
  
    if (!tenantId || !tableNo || !branchId) {
        return res.status(400).json({ error: 'Tenant ID, Branch ID and Table No are required' });
    }

    try {
      // Ensure tenantId and branchId are parsed as integer
      const parsedTenantId = parseInt(tenantId, 10);
      const parsedBranchId = parseInt(branchId, 10);
      
      const query = `
          UPDATE orders 
          SET status = 'COMPLETED'
          WHERE tenant_id = $1 AND branch_id = $2 AND table_no = $3 AND status = 'PENDING'
          RETURNING *
      `;
      const result = await pool.query(query, [parsedTenantId, parsedBranchId, tableNo]);
  
      if (result.rowCount === 0) {
          // No active orders found for this table, or table already closed
          // We can return 404 or just success message saying "No active orders"
          return res.status(200).json({ message: 'No active orders found to close.', closed_orders: 0 });
      }

      if (io) {
          io.to(String(tenantId)).emit('table_closed', {
              table_no: tableNo,
              timestamp: new Date()
          });
      }
  
      res.json({ message: 'Ödeme alındı, masa temizlendi.', closed_orders: result.rowCount });
  
    } catch (error) {
        console.error('Error closing table:', error);
        res.status(500).json({ error: 'Sunucu hatası: Ödeme alınamadı.', details: error.message });
    }
};

// --- Get Branch Status (Active Tables) ---
const getBranchStatus = async (req, res) => {
    const { tenantId, branchId } = req.params;
    try {
        const query = `
            SELECT DISTINCT table_no 
            FROM orders 
            WHERE tenant_id = $1 AND branch_id = $2 AND status = 'PENDING'
        `;
        const result = await pool.query(query, [tenantId, branchId]);
        // Extract table numbers
        const busyTables = result.rows.map(row => row.table_no);
        res.json(busyTables);
    } catch (error) {
        console.error('Error fetching branch status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Get All Orders (Dashboard History) ---
const getAllOrders = async (req, res) => {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    try {
        // Updated query to fetch Branch Name
        const query = `
            SELECT o.*, b.name as branch_name 
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.tenant_id = $1 
            ORDER BY o.created_at DESC 
            LIMIT 50
        `;
        const result = await pool.query(query, [tenantId]);
        
        const formatted = result.rows.map(row => ({
            id: `SIP-${row.id}`,
            status: row.status === 'PENDING' ? 'DOLU' : 'TAMAMLANDI', // Updated Status Logic
            amount: `₺${row.total_amount}`,
            details: row.items,
            created_at: row.created_at,
            table_no: row.table_no,     // Forward Table Info
            branch_name: row.branch_name || 'Merkez' // Forward Branch Info
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Remove Item (Decrease Quantity/Delete) ---
const removeItem = async (req, res) => {
    const { tenantId, branchId, tableNo, productId } = req.params;
    const io = req.app.get('io');

    try {
        // 1. Get Pending Orders for Table
        const query = `
            SELECT * FROM orders 
            WHERE tenant_id = $1 AND branch_id = $2 AND table_no = $3 AND status = 'PENDING'
        `;
        const result = await pool.query(query, [tenantId, branchId, tableNo]);
        
        let targetOrder = null;
        let itemIndex = -1;

        // 2. Find the row containing the product
        for (let row of result.rows) {
            // items is JSONB array
            const foundIndex = row.items.findIndex(i => i.id === parseInt(productId));
            if (foundIndex !== -1) {
                targetOrder = row;
                itemIndex = foundIndex;
                break; // Found the order row to modify
            }
        }

        if (!targetOrder) {
            return res.status(404).json({ error: 'Item not found in active orders' });
        }

        // 3. Modify the array
        const items = targetOrder.items;
        const itemPrice = parseFloat(items[itemIndex].price);
        
        // This endpoint removes ONE instance (decrement)
        // Since our data structure might have separate entries (qty=1) or combined (qty=N), logic depends on how it was saved.
        // Current save logic: simple append with qty=1 usually. But let's handle numeric decrement.
        
        if (items[itemIndex].quantity > 1) {
             items[itemIndex].quantity -= 1;
        } else {
             // Remove the item entirely from array
             items.splice(itemIndex, 1);
        }

        // 4. Update Database
        if (items.length === 0) {
            // If order row empty, delete it
            await pool.query('DELETE FROM orders WHERE id = $1', [targetOrder.id]);
        } else {
            // Update items and total_amount
            // Recalculate total or just subtract? Subtracting is safer for floating point if careful, but recalculating entire array is robust.
            const newTotal = items.reduce((acc, i) => acc + (parseFloat(i.price) * i.quantity), 0);
            
            await pool.query(
                'UPDATE orders SET items = $1, total_amount = $2 WHERE id = $3',
                [JSON.stringify(items), newTotal, targetOrder.id]
            );
        }

        // 5. Emit Update
        if (io) {
            io.to(String(tenantId)).emit('new_order', {
                table_no: tableNo,
                timestamp: new Date() // Trigger refresh
            });
        }

        res.json({ message: 'Item removed/decremented' });

    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Get Pending Approval Orders ---
const getPendingOrders = async (req, res) => {
    const { tenantId, branchId } = req.params;
    try {
        const query = `
            SELECT * FROM orders 
            WHERE tenant_id = $1 AND branch_id = $2 AND status = 'WAITING_APPROVAL'
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query, [tenantId, branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Approve Order ---
const approveOrder = async (req, res) => {
    const { orderId } = req.params;
    const io = req.app.get('io');
    
    try {
        const result = await pool.query(
            "UPDATE orders SET status = 'PENDING' WHERE id = $1 RETURNING *",
            [orderId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const updatedOrder = result.rows[0];

        if (io) {
            io.to(String(updatedOrder.tenant_id)).emit('new_order', {
                id: updatedOrder.id,
                table_no: updatedOrder.table_no,
                branch_id: updatedOrder.branch_id,
                status: 'PENDING', // Now Active
                is_approval: true 
            });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error approving order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
  createOrder,
  getTableOrders,
  closeTable,
  getBranchStatus,
  getAllOrders,
  removeItem,
  getPendingOrders,
  approveOrder
};

