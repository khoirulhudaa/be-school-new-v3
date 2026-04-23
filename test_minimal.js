require('dotenv').config();
const express = require('express');
const app = express();

// Add the same middlewares as index.js
const { tenantMiddleware, enforceTenant } = require('./middlewares/tenant');

// Apply same middleware chain
app.use((req, res, next) => {
    if (req.ip?.startsWith('::ffff:')) {
        req.ip = req.ip.replace('::ffff:', '');
    }
    next();
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Apply tenant middleware
app.use(tenantMiddleware);
app.use(enforceTenant);

// Simple test route
app.get('/testing', (req, res) => {
  res.json({
    success: true,
    message: 'API SEKOLAH (1.0.1) WITH PM2',
    timestamp: new Date().toISOString(),
    schoolId: req.schoolId,
    enforcedSchoolId: req.enforcedSchoolId
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Root OK',
    schoolId: req.schoolId
  });
});

const port = process.env.PORT || 5006;
app.listen(port, '0.0.0.0', () => {
  console.log('Test server on port', port);
});