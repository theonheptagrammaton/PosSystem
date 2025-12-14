const { pool } = require('../config/db');

// List Branches
const getAllBranches = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    let query = 'SELECT * FROM branches WHERE tenant_id = $1';
    const params = [tenantId];

    if (req.user.branch_id) {
        query += ' AND id = $2';
        params.push(req.user.branch_id);
    }

    query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create Branch
const createBranch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { name, address, phone, table_count } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const result = await pool.query(
      'INSERT INTO branches (tenant_id, name, address, phone, table_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tenantId, name, address, phone, table_count || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update Branch
const updateBranch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;
    const { name, address, phone, table_count } = req.body;

    const result = await pool.query(
      'UPDATE branches SET name = $1, address = $2, phone = $3, table_count = $4 WHERE id = $5 AND tenant_id = $6 RETURNING *',
      [name, address, phone, table_count, id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM branches WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found or unauthorized' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch
};
