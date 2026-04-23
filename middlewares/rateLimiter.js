// middleware/rateLimiter.js
const {rateLimit} = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const redisClient = require('../config/redis');
const normalizeIp = require('../hooks/normalizeIp');

const makeRedisStore = (prefix) => new RedisStore({
  prefix,
  sendCommand: (command, ...args) => redisClient.call(command, ...args),
});

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  limit: 100,              
  store: makeRedisStore('rl:global:'),
  // skip: (req) => {
  //   const ip = req.ip || req.connection.remoteAddress;
  //   return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  // },
  validate: { ip: false, xForwardedForHeader: false }, // ← satu saja, hapus `validate: false` di atas
  keyGenerator: (req) => {
    const userId = req.user?.id || req.user?.profile?.id;

    if (userId) {
      console.log(`[LIMITER-GLOBAL]: auth:${userId}`);
      return `auth:${userId}`;
    }

    const ip = normalizeIp(req);
    const ua = (req.headers['user-agent'] || 'no-ua').substring(0, 80);
    console.log(`[LIMITER-GLOBAL]: pub:${ip}`);
    return `pub:${ip}:${ua}`;
  },
  standardHeaders: true, 
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Server sibuk, terlalu banyak permintaan dari perangkat Anda. Coba lagi dalam beberapa saat.'
    });
  }
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  store: makeRedisStore('rl:login:'),
  keyGenerator: (req) => {
    const email = req.body?.email || 'no-email';
    
    const ip = normalizeIp(req);
    const key = `${ip}:${email}`;
    console.log('[USER LOGIN] => ', key)  

    return key;
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false, xForwardedForHeader: false },
  handler: (req, res) => {
    const email = req.body?.email;
    const ip = normalizeIp(req);
    console.log(`[loginLimiter] ⛔ BLOCKED email=${email} | ip=${ip}`);
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 5 menit atau hubungi admin jika lupa password.'
    });
  }
});

// 2. Stricter limiter untuk route sensitif (misal login, create berita, upload)
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  limit: 100,          
  store: makeRedisStore('rl:strict:'),
  validate: { ip: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const userId = req.user?.id || req.user?.profile?.id;

    if (userId) {
      return `auth:${userId}`;
    }

    const ip = normalizeIp(req);
    const ua = (req.headers['user-agent'] || 'no-ua').substring(0, 80);
    return `pub:${ip}:${ua}`;
  },
  standardHeaders: true,  // ← tambah ini juga
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login, tunggu 1 menit.' },
  statusCode: 429,
});

// 3. Limiter khusus untuk route berat (misal upload gambar/fasilitas)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 jam (fix dari 10 menit)
  limit: 50,                  // 50 upload per jam per user
  skipSuccessfulRequests: false,
  store: makeRedisStore('rl:upload:'),
  keyGenerator: (req) => {
    // Pakai userId kalau sudah login, fallback ke IP
    const userId = req.user?.id || req.user?.profile?.id;
    if (userId) return `auth:${userId}`;
    return normalizeIp(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false, xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Batas upload tercapai (50/jam). Coba lagi dalam beberapa saat.'
    });
  }
});

// Export supaya bisa dipakai per route atau global
module.exports = {
  globalLimiter,
  loginLimiter,
  strictLimiter,
  uploadLimiter,
};