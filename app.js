const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// --- GÜVENLİK AYARLARI (CORS) ---
// ALLOWED_ORIGINS: virgülle ayrılmış liste (örn. "https://pos.example.com,http://localhost:5173")
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Listeyi buraya verdik
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// IO nesnesini app'e kaydet
app.set('io', io);

// Middleware - CORS Ayarları (Backend API için)
app.use(cors({
  origin: allowedOrigins, // Listeyi buraya da verdik
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Preflight istekleri için (Bazen tarayıcı önce options atar, onu da kabul edelim)
app.options('*', cors());

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Socket.io Mantığı
io.on('connection', (socket) => {
  const tenantId = socket.handshake.query.tenantId;

  if (tenantId) {
    socket.join(tenantId);
    console.log(`Socket ${socket.id} joined room: ${tenantId}`);
  } else {
    console.log(`Socket ${socket.id} connected without tenantId`);
  }

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

const branchRoutes = require('./routes/branchRoutes');
const reportRoutes = require('./routes/reportRoutes');
// --- EKSİK OLAN SATIRLAR BURADAN BAŞLIYOR ---

const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const publicRoutes = require('./routes/publicRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// --- EKSİK OLAN SATIRLAR BURADA BİTİYOR ---

// Temel Rota (Sağlık Kontrolü)
app.get('/', (req, res) => {
  res.json({ message: 'Point of Sale SaaS API is running' });
});

// Rota Tanımlamaları

app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reports', reportRoutes);

// Auth login için
app.use('/api/auth', publicRoutes); 

// Onboarding için
app.use('/api/users', userRoutes);

// Şubeler için
app.use('/api/branches', branchRoutes);

// Admin için
app.use('/api/admin', adminRoutes);

// Bildirimler için
app.use('/api/notifications', notificationRoutes);

// Veritabanı Bağlantı Kontrolü + Migration
pool.connect()
    .then(client => {
        return client.query('SELECT NOW()')
            .then(res => {
                client.release()
                console.log('Database connection successful:', res.rows[0].now);
            })
            .then(() => {
                // Migration: password_version sütunu yoksa ekle
                return pool.query(`
                    ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS password_version INT NOT NULL DEFAULT 1
                `);
            })
            .then(() => {
                console.log('Migration OK: password_version column ensured.');
            })
            .catch(err => {
                console.error('Database connection/migration error:', err.stack);
            });
    })
    .catch(err => console.error('Error acquiring client', err.stack));

// Sunucuyu Başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});