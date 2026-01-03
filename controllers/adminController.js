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
  const { company_name, domain } = req.body;
  if (!company_name) return res.status(400).json({ error: 'Company Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO tenants (company_name, domain) VALUES ($1, $2) RETURNING *',
      [company_name, domain || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
