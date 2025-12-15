const { pool } = require('../config/db');

// --- Onboarding Logic ---
exports.onboardUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { company_name, full_name } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    if (!company_name || !full_name) {
      return res.status(400).json({ error: 'Company Name and Full Name are required' });
    }

    await client.query('BEGIN');

    // Update Tenant Company Name
    await client.query(
      'UPDATE tenants SET company_name = $1 WHERE id = $2',
      [company_name, tenantId]
    );

    // Update User Onboarding Status
    await client.query(
      'UPDATE users SET full_name = $1, is_onboarded = TRUE WHERE id = $2',
      [full_name, userId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Onboarding completed successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: 'Server Error during onboarding' });
  } finally {
    client.release();
  }
};

// --- RBAC User Management ---

// List Users (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    
    // Only Admin can see this list, normally guarded by middleware, but scoped by tenant_id anyway
    const result = await pool.query(
      'SELECT id, username, role, full_name, branch_id, created_at FROM users WHERE tenant_id = $1 ORDER BY id ASC',
      [tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create User (Admin Only)
exports.createUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    console.log('Creating user for Tenant:', tenantId, 'Body:', req.body); // DEBUG LOG

    const { username, password, role, branch_id, full_name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, Password and Role are required' });
    }

    // Role Validation
    const allowedRoles = ['branch_manager', 'cashier'];
    if (!allowedRoles.includes(role)) {
       return res.status(400).json({ error: 'Invalid role. Allowed: ' + allowedRoles.join(', ') });
    }

    // Branch Required for non-admins
    if (!branch_id) {
        return res.status(400).json({ error: 'Branch assignment is required for this role.' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    // Insert
    const result = await pool.query(
      'INSERT INTO users (tenant_id, username, password, role, branch_id, full_name, is_onboarded) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, username, role, branch_id',
      [tenantId, username, password, role, branch_id, full_name || '']
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating user:', error);
    // Return actual error in dev mode (or safe message)
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;

    // Prevent deleting self (simple check)
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
     console.error('Error deleting user:', error);
     res.status(500).json({ error: 'Internal Server Error' });
  }
};
