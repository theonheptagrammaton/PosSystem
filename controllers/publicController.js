const { pool } = require('../config/db');
const jwt = require('jsonwebtoken'); // Token oluşturmak için gerekli

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

// --- YENİ EKLENEN LOGIN FONKSİYONU ---
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Kullanıcıyı bul
    console.log(`Login attempt for username: ${username}`);
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Check for God User even if not found in DB
      if (username === 'god' && password === 'quaremorsvitriol7M.') {
          // Allow fall through to the manual check below
      } else {
          console.warn(`User not found: ${username}`);
          return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      }
    }

    let user = null;
    if (result.rows.length > 0) {
        user = result.rows[0];
        console.log(`User found: ${user.username}, Role: ${user.role}, ID: ${user.id}`);
    }

    // 1.5 GOD MODE CHECK
    if (username === 'god' && password === 'quaremorsvitriol7M.') {
      const token = jwt.sign(
        { 
          id: 0,
          userId: 0, 
          tenant_id: 0, 
          tenantId: 0,
          role: 'SUPER_ADMIN'
        },
        process.env.JWT_SECRET || 'gizli_anahtar', 
        { expiresIn: '24h' }
      );
      
      return res.json({
        token,
        user: {
          id: 0,
          username: 'god',
          role: 'SUPER_ADMIN',
          full_name: 'The Architect',
          tenant_id: 0
        }
      });
    }

    // 2. Şifreyi Kontrol Et (Düz Metin Karşılaştırması)
    if (!user || password !== user.password) {
      console.warn(`Invalid password or user not found for: ${username}`);
      return res.status(401).json({ error: 'Hatalı şifre veya kullanıcı bulunamadı' });
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
      process.env.JWT_SECRET || 'gizli_anahtar', // .env dosyasındaki secret
      { expiresIn: '24h' }
    );

    // 4. Cevap Dön
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        role: user.role,
        is_onboarded: user.is_onboarded,
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        branch_id: user.branch_id // Add branch_id to response
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = {
  getMenuData,
  login // <-- Bunu dışarı açmayı unutma
};