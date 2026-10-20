// Veritabanındaki düz metin şifreleri bcrypt ile hash'ler. Tekrar çalıştırmak güvenlidir.
// Kullanım: node scripts/hash_existing_passwords.js
const { pool } = require('../config/db');
const { hashPassword, isHashed } = require('../utils/password');

const run = async () => {
  const { rows } = await pool.query('SELECT id, password FROM users');
  let updated = 0;

  for (const user of rows) {
    if (!user.password || isHashed(user.password)) continue;
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [await hashPassword(user.password), user.id]);
    updated++;
  }

  console.log(`Hashed ${updated} of ${rows.length} user passwords.`);
};

run()
  .catch(err => {
    console.error('Password migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
