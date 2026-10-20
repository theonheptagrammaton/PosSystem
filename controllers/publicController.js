const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword, isHashed } = require('../utils/password');

// MENU VERİSİNİ GETİR
const getMenuData = async (req, res) => {
  const { tenantId } = req.params;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    const categoriesResult = await pool.query(
      'SELECT * FROM categories WHERE tenant_id = $1 ORDER BY rank ASC, id ASC',
      [tenantId]
    );

    const tenantResult = await pool.query(
      'SELECT company_name FROM tenants WHERE id = $1',
      [tenantId]
    );
    const companyName = tenantResult.rows.length > 0 ? tenantResult.rows[0].company_name : '';

    const productsResult = await pool.query(
      'SELECT * FROM products WHERE tenant_id = $1 AND is_available = true ORDER BY id ASC',
      [tenantId]
    );

    res.json({
      categories: categoriesResult.rows,
      products: productsResult.rows,
      company_name: companyName
    });
  } catch (error) {
    console.error('Error fetching menu data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// SUPER_ADMIN girişi: SUPERADMIN_USERNAME + SUPERADMIN_PASSWORD_HASH env'den okunur.
// İkisi de tanımlı değilse süper admin girişi kapalıdır.
const tryLoginSuperAdmin = async (username, password) => {
  const { SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD_HASH } = process.env;
  if (!SUPERADMIN_USERNAME || !SUPERADMIN_PASSWORD_HASH) return false;
  if (username !== SUPERADMIN_USERNAME) return false;
  if (!isHashed(SUPERADMIN_PASSWORD_HASH)) {
    console.error('SUPERADMIN_PASSWORD_HASH must be a bcrypt hash (see scripts/hash_password.js)');
    return false;
  }
  const { valid } = await verifyPassword(password, SUPERADMIN_PASSWORD_HASH);
  return valid;
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }

  try {
    // 1. Süper admin kontrolü
    if (await tryLoginSuperAdmin(username, password)) {
      const token = jwt.sign(
        {
          id: 0,
          userId: 0,
          tenant_id: 0,
          tenantId: 0,
          role: 'SUPER_ADMIN'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: 0,
          username,
          role: 'SUPER_ADMIN',
          full_name: 'Super Admin',
          tenant_id: 0
        }
      });
    }

    // 2. Kullanıcıyı bul ve şifreyi doğrula
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];
    const { valid, needsRehash } = await verifyPassword(password, user && user.password);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Hatalı şifre veya kullanıcı bulunamadı' });
    }

    // Eski düz metin şifreyi ilk başarılı girişte hash'le
    if (needsRehash) {
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [await hashPassword(password), user.id]);
    }

    // 3. Token Oluştur
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        tenant_id: user.tenant_id,
        tenantId: user.tenant_id,
        role: user.role,
        branch_id: user.branch_id,
        branchId: user.branch_id,
        passwordVersion: user.password_version || 1
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Cevap Dön
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_onboarded: user.is_onboarded,
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        branch_id: user.branch_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = {
  getMenuData,
  login
};