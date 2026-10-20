// Kullanım: node scripts/hash_password.js "<şifre>"
// Çıktıyı .env içindeki SUPERADMIN_PASSWORD_HASH değerine yapıştırın.
const { hashPassword } = require('../utils/password');

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node scripts/hash_password.js "<password>"');
  process.exit(1);
}

hashPassword(plain).then(hash => console.log(hash));
