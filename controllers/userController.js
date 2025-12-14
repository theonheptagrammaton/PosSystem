const { pool } = require('../config/db');

exports.onboardUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { company_name, full_name } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenant_id;

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
