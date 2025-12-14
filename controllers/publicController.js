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
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const user = result.rows[0];

    // 2. Şifreyi Kontrol Et (Düz Metin Karşılaştırması)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Hatalı şifre' });
    }

    // 3. Token Oluştur
    const token = jwt.sign(
      { 
        userId: user.id, 
        tenantId: user.tenant_id, 
        role: user.role 
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
        tenant_id: user.tenant_id // <-- İstemci tarafında kullanılıyor
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