const { pool } = require('../config/db');

// List Products
const getAllProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { category_id } = req.query;

    let query = 'SELECT * FROM products WHERE tenant_id = $1';
    let params = [tenantId];

    if (category_id) {
      query += ' AND category_id = $2';
      params.push(category_id);
    }

    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create Product
const createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { category_id, name, description, price, is_available } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and Price are required' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    const result = await pool.query(
      'INSERT INTO products (tenant_id, category_id, name, description, price, is_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tenantId, category_id || null, name, description, price, is_available !== undefined ? is_available : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;
    const { category_id, name, description, price, is_available } = req.body;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    // Build dynamic query
    let fields = [];
    let values = [];
    let idx = 1;

    if (category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(category_id); }
    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(price); }
    if (is_available !== undefined) { fields.push(`is_available = $${idx++}`); values.push(is_available); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    values.push(tenantId);

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx++} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
