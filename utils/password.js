const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const isHashed = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

// Eski düz metin kayıtlar için geriye dönük uyumlu kontrol.
// Düz metin eşleşirse çağıran taraf şifreyi hash'leyip güncellemeli (needsRehash).
const verifyPassword = async (plain, stored) => {
  if (!plain || !stored) return { valid: false, needsRehash: false };

  if (isHashed(stored)) {
    return { valid: await bcrypt.compare(plain, stored), needsRehash: false };
  }

  return { valid: plain === stored, needsRehash: plain === stored };
};

module.exports = { hashPassword, verifyPassword, isHashed };
