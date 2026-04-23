const {rateLimit, ipKeyGenerator} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const redisClient = require('../config/redis');
const normalizeIp = require('../hooks/normalizeIp');

const makeRedisStore = (prefix) => new RedisStore({
  prefix,
  sendCommand: (command, ...args) => redisClient.call(command, ...args),
});

const alumniLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 1 Menit
    limit: 100, 
    store: makeRedisStore('rl:alumni:'),
    validate: { ip: false, xForwardedForHeader: false },
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?.profile?.id;
        if (userId) return `auth:${userId}`;

        // ipKeyGenerator menangani normalisasi IPv6 otomatis
        const ip = normalizeIp(req);
        const ua = (req.headers['user-agent'] || 'no-ua').substring(0, 80);

        console.log(`[LIMITER-ALUMNI]: pub:${ip}`);
        return `pub:${ip}:${ua}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Tunggu sebentar sebelum memuat berita lagi.'
        });
    }
});

module.exports = alumniLimiter;