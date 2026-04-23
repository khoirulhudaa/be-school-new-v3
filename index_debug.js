require('dotenv').config();
const express = require('express');
const app = express();

// Log all errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

// Test route FIRST - before any middleware
app.get('/testing', (req, res) => {
  console.log('/testing hit');
  res.json({
    success: true,
    message: 'TEST SUCCESS',
    schoolId: req.schoolId,
    query: req.query
  });
});

app.get('/', (req, res) => {
  console.log('/ hit');
  res.json({ success: true, message: 'ROOT OK', schoolId: req.schoolId });
});

// Then add minimal middleware
const { tenantMiddleware, enforceTenant } = require('./middlewares/tenant');

// Catch-all for debugging
app.use((req, res, next) => {
  console.log('Request:', req.method, req.path);
  next();
});

app.use(tenantMiddleware);
app.use(enforceTenant);

// Routes after middleware
app.get('/after-middleware', (req, res) => {
  res.json({ success: true, message: 'AFTER MIDDLEWARE', schoolId: req.schoolId });
});

// Use the routes
const apiRoutes = require('./routes');
app.use('/', apiRoutes);

// Final error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const port = process.env.PORT || 5006;
app.listen(port, '0.0.0.0', () => {
  console.log('Server on port', port);
});