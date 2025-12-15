const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

async function migrate() {
  console.log('DB Config Check:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      db: process.env.DB_NAME,
      user: process.env.DB_USER
  });

  try {
    console.log('Running migration...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;');
    console.log('Migration successful: branch_id added to orders.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
