require('dotenv').config();
const express = require('express');
const app = express();

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

// Test route ONLY - completely isolated
app.get('/testing', (req, res) => {
  console.log('/testing hit - no middleware!');
  res.json({
    success: true,
    message: 'TEST SUCCESS NO MIDDLEWARE',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  console.log('/ hit - no middleware!');
  res.json({ success: true, message: 'ROOT TEST OK' });
});

app.get('/simple', (req, res) => {
  res.json({ test: 'simple' });
});

// NO routes - just test
const port = process.env.PORT || 5006;
app.listen(port, '0.0.0.0', () => {
  console.log('Simple server on port', port);
});