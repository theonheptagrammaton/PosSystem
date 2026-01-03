const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('Checking for rank column in products table...');
    
    // Check if column exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='rank';
    `);

    if (checkRes.rows.length === 0) {
      console.log('Adding rank column to products table...');
      await pool.query('ALTER TABLE products ADD COLUMN rank INTEGER DEFAULT 0;');
      console.log('Successfully added rank column.');
    } else {
      console.log('Rank column already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
