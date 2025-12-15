const express = require('express');
const router = express.Router();

router.post('/simulate-order', (req, res) => {
  const { tenantId } = req.body;
  const io = req.app.get('io');

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  // Simulate random order amount between 50 and 500
  const amount = Math.floor(Math.random() * 450) + 50;

  // Emit event to specific tenant room
  const roomName = String(tenantId);
  io.to(roomName).emit('new_order', {
    amount: amount,
    timestamp: new Date().toISOString()
  });

  console.log(`Simulating order for Tenant: ${tenantId}, Room: ${roomName}`);

  res.json({ 
    message: 'Order simulated successfully', 
    data: { tenantId, amount } 
  });
});

module.exports = router;
