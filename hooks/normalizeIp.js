// utils/normalizeIp.js

/**
 * Normalize IP address from request object.
 * Handles IPv6-mapped IPv4 addresses (::ffff:x.x.x.x → x.x.x.x)
 * Replacement for ipKeyGenerator from express-rate-limit v8
 */
const normalizeIp = (req) => {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';

  // Normalize IPv6-mapped IPv4: ::ffff:1.2.3.4 → 1.2.3.4
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip;
};

module.exports = normalizeIp;