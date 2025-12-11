const { pool } = require('../config/db');

const getMenuData = async (req, res) => {
  const { tenantId } = req.params;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // Fetch Categories
    const categoriesResult = await pool.query(
      'SELECT * FROM categories WHERE tenant_id = $1 ORDER BY rank ASC, id ASC',
      [tenantId]
    );

    // Fetch Active Products
    const productsResult = await pool.query(
      'SELECT * FROM products WHERE tenant_id = $1 AND is_available = true ORDER BY id ASC',
      [tenantId]
    );

    res.json({
      categories: categoriesResult.rows,
      products: productsResult.rows
    });
  } catch (error) {
    console.error('Error fetching menu data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getMenuData
};
