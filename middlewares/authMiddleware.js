const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // SUPER_ADMIN (god user) has no DB record, skip version check
  if (decoded.role === 'SUPER_ADMIN') {
    req.user = decoded;
    return next();
  }

  // Şifre değiştirilmiş mi kontrol et
  try {
    const result = await pool.query(
      'SELECT password_version FROM users WHERE id = $1',
      [decoded.id || decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const currentVersion = result.rows[0].password_version || 1;
    const tokenVersion = decoded.passwordVersion || 1;

    if (currentVersion !== tokenVersion) {
      return res.status(401).json({ error: 'Şifre değiştirildi, lütfen tekrar giriş yapın' });
    }
  } catch (dbErr) {
    console.error('Auth version check error:', dbErr.message);
    return res.status(500).json({ error: 'Kimlik doğrulama hatası' });
  }

  req.user = decoded;
  next();
};

module.exports = authenticateToken;
