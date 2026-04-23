const {rateLimit, ipKeyGenerator} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
// Pastikan redisClient sudah di-import dari file konfigurasi Redis kamu
const redisClient = require('../config/redis');
const normalizeIp = require('../hooks/normalizeIp');

const makeRedisStore = (prefix) => new RedisStore({
  prefix,
  sendCommand: (command, ...args) => redisClient.call(command, ...args),
});

const tugasLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Periode 1 menit
    limit: 100, // Jatah 60 request per menit per siswa
    standardHeaders: true, 
    legacyHeaders: false,
    store: makeRedisStore('rl:tugas:'),
    validate: { ip: false, xForwardedForHeader: false },
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?.profile?.id;
        if (userId) return `auth:${userId}`;

        // ipKeyGenerator menangani normalisasi IPv6 otomatis
        const ip = normalizeIp(req);
        const ua = (req.headers['user-agent'] || 'no-ua').substring(0, 80);

        console.log(`[LIMITER-TUGAS]: pub:${ip}`);
        return `pub:${ip}:${ua}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Akses ke daftar tugas terlalu cepat. Silakan tunggu 1 menit.'
        });
    }
});

module.exports = tugasLimiter;