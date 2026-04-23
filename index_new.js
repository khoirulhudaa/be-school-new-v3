require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL ERROR]:', reason);
});

const http = require('http');
const { Server } = require('socket.io');

const Student = require('./models/siswa');
const Parent = require('./models/orangTua');

Parent.hasMany(Student, { foreignKey: 'parentId', as: 'children' });
Student.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });

const apiRoutes = require('./routes');
const { initWhatsApp } = require('./config/whatsapp');
const { tenantMiddleware, enforceTenant } = require('./middlewares/tenant');

const port = process.env.PORT || 5006;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = new Redis(process.env.REDIS_URL);

pubClient.on('connect', () => console.log('[Socket.IO] Redis pub connected'));
subClient.on('connect', () => console.log('[Socket.IO] Redis sub connected'));
pubClient.on('error', (err) => console.error('[Socket.IO] Redis pub error:', err.message));
subClient.on('error', (err) => console.error('[Socket.IO] Redis sub error:', err.message));

io.adapter(createAdapter(pubClient, subClient));

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('join-school', (schoolId) => {
    socket.join(`school-${schoolId}`);
  });
  socket.on('join-login-room', (sessionId) => {
    socket.join(sessionId);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('trust proxy', 1);

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

// Tenant middleware - add error handler here
const safeTenantMiddleware = async (req, res, next) => {
  try {
    const { tenantMiddleware: tenant } = require('./middlewares/tenant');
    await tenant(req, res, next);
  } catch (err) {
    console.error('Tenant middleware error:', err);
    next();
  }
};

// Add routes directly with error handler
app.use(safeTenantMiddleware);
app.use(enforceTenant);

app.use('/uploads', express.static(uploadDir));

// Direct test routes
app.get('/test-direct', (req, res) => {
  res.json({ success: true, message: 'Direct test OK', schoolId: req.schoolId });
});

// Use apiRoutes
app.use('/', apiRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

console.log('Starting server on port', port);
server.listen(port, '0.0.0.0', () => {
  console.log('Server with Socket.io running on port', port);
  initWhatsApp();
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});