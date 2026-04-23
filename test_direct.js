require('dotenv').config();

// Test just the route handler directly
const express = require('express');
const app = express();

// Simple test route matching /testing
app.get('/testing', (req, res) => {
  console.log('Direct /testing route hit!');
  res.json({
    success: true,
    message: 'Direct Test OK',
    timestamp: new Date().toISOString()
  });
});

// Also test root
app.get('/', (req, res) => {
  console.log('Direct / route hit!');
  res.json({
    success: true,
    message: 'Direct Root OK'
  });
});

const port = 5010;
app.listen(port, () => {
  console.log('Test server on port', port);
});

setTimeout(() => {
  console.log('Test complete, exiting');
  process.exit(0);
}, 2000);