require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// CRITICAL: Define test routes FIRST, before anything else
console.log('[DEBUG] Defining direct test routes...');
app.get('/direct-test', (req, res) => {
  console.log('[DEBUG] /direct-test handler called');
  res.json({ success: true, message: 'Direct route works!' });
});

app.get('/testing', (req, res) => {
  console.log('[DEBUG] /testing handler called');
  res.json({ success: true, message: 'Testing route works!' });
});

app.get('/', (req, res) => {
  console.log('[DEBUG] / handler called');
  res.json({ success: true, message: 'Root route works!' });
});

// Log all requests
app.use((req, res, next) => {
  console.log('[DEBUG] Request:', req.method, req.path);
  next();
});

// NOW load routes - but don't use them yet
console.log('[DEBUG] Loading routes...');
try {
  const apiRoutes = require('./routes');
  console.log('[DEBUG] Routes loaded, type:', typeof apiRoutes);

  // Only add if apiRoutes is valid
  if (apiRoutes && typeof apiRoutes === 'function') {
    app.use(apiRoutes);
    console.log('[DEBUG] Routes mounted');
  } else {
    console.log('[DEBUG] Routes not mounted - invalid type');
  }
} catch(e) {
  console.error('[DEBUG] Route loading error:', e.message);
}

// Final error handler
app.use((err, req, res, next) => {
  console.error('[DEBUG] Error handler:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

const port = process.env.PORT || 5006;
console.log('[DEBUG] Starting server on port', port);

app.listen(port, '0.0.0.0', () => {
  console.log('[DEBUG] Server started on port', port);
});