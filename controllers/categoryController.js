const { pool } = require('../config/db');

// List Categories
const getAllCategories = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      'SELECT * FROM categories WHERE tenant_id = $1 ORDER BY rank ASC, id ASC', 
      [tenant_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create Category
const createCategory = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const { name, rank } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await pool.query(
      'INSERT INTO categories (tenant_id, name, rank) VALUES ($1, $2, $3) RETURNING *',
      [tenant_id, name, rank || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const { id } = req.params;
    const { name, rank } = req.body;

    const result = await pool.query(
      'UPDATE categories SET name = $1, rank = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
      [name, rank, id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
