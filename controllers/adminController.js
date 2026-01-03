const { pool } = require('../config/db');

// --- Global Stats ---
const getGlobalStats = async (req, res) => {
  try {
    const stats = {};

    // 1. Total Tenants
    const tenantRes = await pool.query('SELECT COUNT(*) FROM tenants');
    stats.total_tenants = parseInt(tenantRes.rows[0].count);

    // 2. Total Revenue (Aggregated from all orders)
    const revRes = await pool.query("SELECT SUM(total_amount) FROM orders WHERE status = 'COMPLETED' OR status = 'TAMAMLANDI'");
    stats.total_revenue = parseFloat(revRes.rows[0].sum || 0);

    // 3. Total Orders
    const orderRes = await pool.query('SELECT COUNT(*) FROM orders');
    stats.total_orders = parseInt(orderRes.rows[0].count);

    // 4. Active Sessions (socket rooms roughly, but here we can just count users or branches)
    const userRes = await pool.query('SELECT COUNT(*) FROM users');
    stats.total_users = parseInt(userRes.rows[0].count);

    // 5. Chart Data (Last 30 Days Revenue & Orders)
    const chartRes = await pool.query(`
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date,
            SUM(total_amount) as revenue,
            COUNT(*) as orders
        FROM orders 
        WHERE (status = 'COMPLETED' OR status = 'TAMAMLANDI')
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
    `);
    
    stats.chart_data = chartRes.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
        orders: parseInt(row.orders)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- Tenant Management ---
const getAllTenants = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createTenant = async (req, res) => {
  const { company_name, domain, admin_username, admin_password } = req.body;
  
  if (!company_name || !admin_username || !admin_password) {
      return res.status(400).json({ error: 'Company Name, Username and Password are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create Tenant
    const tenantRes = await client.query(
      'INSERT INTO tenants (company_name, domain) VALUES ($1, $2) RETURNING *',
      [company_name, domain || null]
    );
    const newTenant = tenantRes.rows[0];

    // 2. Create Admin User for Tenant
    // Note: In production you should hash the password! storing plain for now as per system behavior
    const userRes = await client.query(
        `INSERT INTO users (tenant_id, username, password, role, full_name, is_onboarded) 
         VALUES ($1, $2, $3, 'admin', 'Mekan Sahibi', true) RETURNING *`,
        [newTenant.id, admin_username, admin_password]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
        tenant: newTenant, 
        admin_user: userRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      client.release();
  }
};

const deleteTenant = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
  getGlobalStats,
  getAllTenants,
  createTenant,
  deleteTenant
};
