const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store io instance in app to facilitate use in controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Logic
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

// Import Routes
const testRoutes = require('./routes/testRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Point of Sale SaaS API is running' });
});

// Use Routes
app.use('/api/test', testRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/public', publicRoutes);

// Database Connection Check
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

// Start Server (Change app.listen to server.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
