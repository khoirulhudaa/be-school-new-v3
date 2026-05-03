require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { securityMiddleware, createAuthLimiter, createAPILimiter } = require('./middlewares/security');
const { validateApiKey, optionalApiKey } = require('./middlewares/apiKeyAuth');

// Import Tenant model for relations
const Tenant = require('./models/tenant');

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL ERROR]:', reason instanceof Error ? reason.message : JSON.stringify(reason));
    if (reason?.stack) console.error('Stack:', reason.stack);
});

// --- 1. IMPORT HTTP & SOCKET.IO ---
const http = require('http');
const { Server } = require('socket.io');

const Student = require('./models/siswa');
const Parent = require('./models/orangTua');

// Definisikan hubungan di sini, di luar file model masing-masing
Parent.hasMany(Student, { foreignKey: 'parentId', as: 'children' });
Student.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });

// Import semua routes dari satu file
const apiRoutes = require('./routes');  // → routes/index.js
const { initWhatsApp } = require('./config/whatsapp');
const { tenantMiddleware, enforceTenant } = require('./middlewares/tenant');

const app = express();
const port = process.env.PORT || 5006;

// --- 2. BUAT HTTP SERVER ---
const server = http.createServer(app);

// --- 3. INISIALISASI SOCKET.IO ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- 4. REDIS ADAPTER (agar semua cluster instance share room yang sama) ---
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = new Redis(process.env.REDIS_URL);

pubClient.on('connect', () => console.log('[Socket.IO] Redis pub connected'));
subClient.on('connect', () => console.log('[Socket.IO] Redis sub connected'));
pubClient.on('error', (err) => console.error('[Socket.IO] Redis pub error:', err.message));
subClient.on('error', (err) => console.error('[Socket.IO] Redis sub error:', err.message));

io.adapter(createAdapter(pubClient, subClient));

// --- 5. SIMPAN IO KE APP AGAR BISA DIAKSES DI CONTROLLER ---
app.set('socketio', io);

// --- 6. LOGIKA SOCKET CONNECTION ---
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('join-school', (schoolId) => {
    socket.join(`school-${schoolId}`);
  });

  // Web Perpus join room berdasarkan UUID sessionId
  socket.on('join-login-room', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client joined room: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('trust proxy', 1);

// ============================================================
// SECURITY: Helmet headers
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://be-school.kiraproject.id"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Extra security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ============================================================
// SECURITY: Global Rate Limiting
// ============================================================
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for general API
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan tunggu sebentar.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ============================================================
// SECURITY: SQL Injection & XSS Protection
// ============================================================
app.use(securityMiddleware);

app.use((req, res, next) => {
    if (req.ip?.startsWith('::ffff:')) {
        req.ip = req.ip.replace('::ffff:', '');
    }
    next();
});

if (process.env.NODE_ENV !== 'production') {
  app.set('json spaces', 2);
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5005",
];

// Allow all school domains for multi-tenant
const schoolDomains = process.env.ALLOWED_DOMAINS ? process.env.ALLOWED_DOMAINS.split(',') : [];
const allAllowedOrigins = [...allowedOrigins, ...schoolDomains];

app.use(cors({
  origin: function (origin, callback) {
    // allow request tanpa origin (postman, mobile app, dll)
    if (!origin) return callback(null, true);

    if (allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Allow all domains for multi-tenant - check if it's a valid domain format
      if (origin.includes('.') && !origin.includes('..')) {
        callback(null, true); // Allow all domains with dots (school domains)
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Host', 'X-API-Key', 'X-School-Id'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Validate API Key for tenant routes
const { validateApiKey } = require('./middlewares/apiKeyAuth');

// Protected routes that require API key
app.use('/profileSekolah', validateApiKey);

// Multi-tenant: resolve schoolId dari domain
app.use(tenantMiddleware);
app.use(enforceTenant);

// Static folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ── Hanya 1 baris ini untuk semua routes + limiter mereka ───────
app.use('/api', apiRoutes);

// =============================================
// GLOBAL ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
  // Skip logging untuk CORS error — tidak perlu dicatat
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin tidak diizinkan'
    });
  }

  // 1. CETAK ERROR KE TERMINAL (Agar terlihat di PM2 Logs)
  console.error(`[${new Date().toISOString()}] ERROR TERDETEKSI:`);
  console.error(err.stack);

  // 2. LOG TAMBAHAN
  console.error(`Method: ${req.method} | URL: ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.error(`Body:`, JSON.stringify(req.body));
  }

  // 3. KIRIM RESPON KE FRONTEND
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// --- 7. DATABASE CONNECTION & START SERVER ---
sequelize.authenticate()
  .then(() => {
    return sequelize.sync({ alter: false, force: false });
  })
  .then(() => {
    server.listen(port, '0.0.0.0', () => {
      
      console.log(`Server with Socket.io running on port ${port}`);
      initWhatsApp();
      console.log('WhatsApp initialization started...');

    });
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });