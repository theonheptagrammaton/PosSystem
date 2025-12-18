const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const authenticateToken = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Sadece resim dosyaları yüklenebilir!'));
  }
});

// Apply middleware to all routes
router.use(authenticateToken);

router.get('/', getAllProducts);
router.post('/', createProduct);
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
