require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Test routes FIRST
app.get('/testing', (req, res) => {
  res.json({ success: true, message: 'Testing route works!' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Root route works!' });
});

// Load tenant middleware
console.log('[DEBUG] Loading tenant middleware...');
const { tenantMiddleware, enforceTenant } = require('./middlewares/tenant');
console.log('[DEBUG] Tenant middleware loaded');

const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Apply tenant middleware
console.log('[DEBUG] Applying tenant middleware...');
app.use(tenantMiddleware);
app.use(enforceTenant);
console.log('[DEBUG] Tenant middleware applied');

// Log all requests
app.use((req, res, next) => {
  console.log('[DEBUG] Request:', req.method, req.path, 'schoolId:', req.schoolId);
  next();
});

// Load routes
console.log('[DEBUG] Loading routes...');
try {
  const apiRoutes = require('./routes');
  console.log('[DEBUG] Routes loaded');
  app.use(apiRoutes);
  console.log('[DEBUG] Routes mounted');
} catch(e) {
  console.error('[DEBUG] Route loading error:', e.message);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('[DEBUG] Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

const port = process.env.PORT || 5006;
console.log('[DEBUG] Starting server on port', port);

const server = http.createServer(app);

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = new Redis(process.env.REDIS_URL);

pubClient.on('connect', () => console.log('[DEBUG] Redis pub connected'));
subClient.on('connect', () => console.log('[DEBUG] Redis sub connected'));
pubClient.on('error', (err) => console.error('[DEBUG] Redis pub error:', err.message));
subClient.on('error', (err) => console.error('[DEBUG] Redis sub error:', err.message));

const io = new Server(server, { cors: { origin: '*' } });
io.adapter(createAdapter(pubClient, subClient));
app.set('socketio', io);

server.listen(port, '0.0.0.0', () => {
  console.log('[DEBUG] Server started on port', port);
});