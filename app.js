const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    // Hem localhost hem de production domainine izin veriyoruz
    origin: [
      "http://localhost:5173", 
      "https://pos.theon.com.tr", 
      "https://app.theon.com.tr"
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// IO nesnesini app'e kaydet (Controller'larda kullanmak için)
app.set('io', io);

// Middleware - CORS Ayarları (Backend API için)
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://pos.theon.com.tr",
    "https://app.theon.com.tr"
  ],
  credentials: true
}));

app.use(express.json());

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

// Rota Dosyalarını İçe Aktar
const testRoutes = require('./routes/testRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Temel Rota (Sağlık Kontrolü)
app.get('/', (req, res) => {
  res.json({ message: 'Point of Sale SaaS API is running' });
});

// Rota Tanımlamaları
app.use('/api/test', testRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/public', publicRoutes);

// --- DÜZELTME BURADA ---
// Frontend '/api/auth/login' adresine istek atıyor.
// Eğer login fonksiyonun publicRoutes içindeyse, '/api/auth' yolunu da oraya bağlıyoruz.
app.use('/api/auth', publicRoutes); 

// --- YENI DÜZELTME ---
// Frontend '/api/users/onboard' adresine istek atıyor.
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
// ---------------------

// Veritabanı Bağlantı Kontrolü
pool.connect()
    .then(client => {
        return client.query('SELECT NOW()')
            .then(res => {
                client.release()
                console.log('Database connection successful:', res.rows[0].now);
            })
            .catch(err => {
                client.release()
                console.error('Database connection error:', err.stack);
            });
    })
    .catch(err => console.error('Error acquiring client', err.stack));

// Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});