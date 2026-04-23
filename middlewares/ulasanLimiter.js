const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const redisClient = require('../config/redis');
const normalizeIp = require('../hooks/normalizeIp');

const makeRedisStore = (prefix) => new RedisStore({
  prefix,
  sendCommand: (command, ...args) => redisClient.call(command, ...args),
});

const ulasanLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 10 Menit
    limit: 100, 
    // PERBAIKAN 2: Tambahkan validate ini untuk menghilangkan error IPv6
    store: makeRedisStore('rl:ulasan:'),
    validate: { ip: false, xForwardedForHeader: false },
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?.profile?.id;
        if (userId) return `auth:${userId}`;

        // ipKeyGenerator menangani normalisasi IPv6 otomatis
        const ip = normalizeIp(req);
        const ua = (req.headers['user-agent'] || 'no-ua').substring(0, 80);

        console.log(`[LIMITER-ULASAN]: pub:${ip}`);
        return `pub:${ip}:${ua}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Anda terlalu sering memberi ulasan, coba lagi nanti.'
        });
    }
});

module.exports = ulasanLimiter;