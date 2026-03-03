const { pool } = require('../config/db');

// --- Onboarding Logic ---
exports.onboardUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { company_name, full_name, phone } = req.body;
    const userId = req.user.id || req.user.userId;
    const tenantId = req.user.tenantId || req.user.tenant_id;

    if (!company_name || !full_name || !phone) {
      return res.status(400).json({ error: 'Company Name, Full Name and Phone are required' });
    }

    await client.query('BEGIN');

    // Update Tenant Company Name
    await client.query(
      'UPDATE tenants SET company_name = $1 WHERE id = $2',
      [company_name, tenantId]
    );

    // Update User Onboarding Status
    await client.query(
      'UPDATE users SET full_name = $1, phone = $2, is_onboarded = TRUE WHERE id = $3',
      [full_name, phone, userId]
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
    const allowedRoles = ['branch_manager', 'cashier', 'waiter', 'kitchen'];
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

// Update User (Admin Only) - şifre değişince password_version artırılır
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;
    const { password, full_name, branch_id } = req.body;

    if (!password && !full_name && !branch_id) {
      return res.status(400).json({ error: 'Güncellenecek en az bir alan gerekli' });
    }

    // Kullanıcının bu tenant'a ait olduğunu doğrula
    const check = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(full_name);
    }
    if (branch_id !== undefined) {
      updates.push(`branch_id = $${idx++}`);
      values.push(branch_id);
    }
    if (password) {
      updates.push(`password = $${idx++}`);
      updates.push(`password_version = COALESCE(password_version, 1) + 1`);
      values.push(password);
    }

    values.push(id);
    values.push(tenantId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx++} AND tenant_id = $${idx}`,
      values
    );

    res.json({ message: 'Kullanıcı güncellendi' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.tenant_id;
    const { id } = req.params;

    // Prevent deleting self (simple check)
    if (parseInt(id) === (req.user.id || req.user.userId)) {
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
