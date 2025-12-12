const express = require('express');
const router = express.Router();
// Controller'dan login fonksiyonunu da import et
const { getMenuData, login } = require('../controllers/publicController');

// Mevcut menü rotası
router.get('/menu/:tenantId', getMenuData);

// --- YENİ EKLENEN LOGIN ROTASI ---
// Frontend '/api/auth/login' atıyor.
// app.js dosyası '/api/auth' kısmını buraya yönlendiriyor.
// Biz buraya '/login' diyince adres tamamlanıyor.
router.post('/login', login); 

module.exports = router;