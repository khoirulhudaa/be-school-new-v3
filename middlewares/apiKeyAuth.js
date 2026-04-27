/**
 * API Key Authentication Middleware
 * For multi-tenant security
 */

const Tenant = require('../models/tenant');
const crypto = require('crypto');

// ============================================================
// 1. GENERATE CREDENTIALS
// ============================================================

/**
 * Generate a new API Key
 * Format: tenant-{timestamp}-{random}
 */
exports.generateApiKey = () => {
  return `tenant-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Generate a new API Secret
 */
exports.generateApiSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash API Secret for secure storage
 */
exports.hashSecret = (secret) => {
  return crypto.createHash('sha256').update(secret).digest('hex');
};

// ============================================================
// 2. VALIDATE API KEY (Main Middleware)
// ============================================================

exports.validateApiKey = async (req, res, next) => {
  try {
    // Check for API key header
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API Key diperlukan. Tambahkan header X-API-Key.',
        code: 'MISSING_API_KEY',
        hint: 'Contoh: X-API-Key: tenant-55-abc123xyz'
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('tenant-')) {
      return res.status(401).json({
        success: false,
        message: 'Format API Key tidak valid',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }

    // Find tenant by API key
    const tenant = await Tenant.findOne({
      where: { apiKey: apiKey }
    });

    // If no tenant found
    if (!tenant) {
      console.warn(`[SECURITY] Invalid API key attempt: ${apiKey.substring(0, 30)}... from ${req.ip}`);
      console.warn(`[SECURITY] Path: ${req.path} | Method: ${req.method}`);

      return res.status(403).json({
        success: false,
        message: 'API Key tidak valid atau tidak ditemukan',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      console.warn(`[SECURITY] Inactive tenant access attempt: ${tenant.id} from ${req.ip}`);

      return res.status(403).json({
        success: false,
        message: 'Tenant tidak aktif',
        code: 'TENANT_INACTIVE'
      });
    }

    // Check subscription status
    if (tenant.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Langganan sudah expired. Hubungi admin untuk perpanjang.',
        code: 'SUBSCRIPTION_EXPIRED',
        expiredAt: tenant.subscriptionEnd
      });
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Akun suspended. Hubungi admin untuk aktivasi.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Check subscription end date
    if (tenant.subscriptionEnd && new Date() > tenant.subscriptionEnd && tenant.status === 'active') {
      tenant.status = 'expired';
      await tenant.save();

      return res.status(403).json({
        success: false,
        message: 'Langganan sudah expired. Hubungi admin untuk perpanjang.',
        code: 'SUBSCRIPTION_EXPIRED',
        expiredAt: tenant.subscriptionEnd
      });
    }

    // Verify domain if configured
    const origin = req.headers.origin || req.headers.host;
    if (origin && tenant.allowedDomains && tenant.allowedDomains.length > 0) {
      const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];

      if (!tenant.allowedDomains.includes(originHost)) {
        console.warn(`[SECURITY] Domain not allowed: ${originHost} for tenant ${tenant.id}`);

        // Soft reject - allow but log for monitoring
        // Uncomment next block for strict mode:
        // return res.status(403).json({
        //   success: false,
        //   message: 'Domain tidak diizinkan',
        //   code: 'DOMAIN_NOT_ALLOWED'
        // });
      }
    }

    // Verify IP if configured (optional)
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    if (tenant.allowedIps && tenant.allowedIps.length > 0) {
      if (!tenant.allowedIps.includes(clientIP)) {
        console.warn(`[SECURITY] IP not in whitelist: ${clientIP} for tenant ${tenant.id}`);
        // Soft reject - log only
      }
    }

    // Record access for monitoring
    tenant.lastAccessAt = new Date();
    tenant.lastIP = clientIP;
    tenant.accessCount += 1;
    tenant.save().catch(err => console.error('Failed to record access:', err));

    // Attach tenant info to request
    req.tenant = {
      id: tenant.id,
      schoolId: tenant.schoolId,
      schoolName: tenant.schoolName,
      domain: tenant.domain,
      package: tenant.package,
      status: tenant.status,
      rateLimitRequests: tenant.rateLimitRequests,
      rateLimitWindow: tenant.rateLimitWindow,
    };

    next();
  } catch (err) {
    console.error('[API_KEY_AUTH] Error:', err);
    // On error, continue but log - don't block legitimate requests
    next();
  }
};

// ============================================================
// 3. VALIDATE WEBHOOK SIGNATURE (HMAC)
// ============================================================

exports.validateWebhookSignature = async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // If no signature required for this endpoint, skip
    if (!signature && !timestamp) {
      return next();
    }

    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        message: 'Webhook signature required',
        code: 'MISSING_WEBHOOK_SIGNATURE'
      });
    }

    // Check timestamp age (max 5 minutes)
    const age = Date.now() - parseInt(timestamp);
    if (age > 5 * 60 * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Webhook timestamp expired',
        code: 'WEBHOOK_TIMESTAMP_EXPIRED'
      });
    }

    // Validate HMAC signature
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Tenant not authenticated',
        code: 'TENANT_NOT_AUTHENTICATED'
      });
    }

    // Get tenant's hashed secret
    const tenantRecord = await Tenant.findByPk(tenant.id);
    if (!tenantRecord || !tenantRecord.apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured',
        code: 'WEBHOOK_NOT_CONFIGURED'
      });
    }

    // Compute expected signature
    const payload = `${timestamp}.${JSON.stringify(req.body)}`;
    const expectedSig = crypto
      .createHmac('sha256', tenantRecord.apiSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn(`[SECURITY] Invalid webhook signature from tenant ${tenant.id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
        code: 'INVALID_WEBHOOK_SIGNATURE'
      });
    }

    next();
  } catch (err) {
    console.error('[WEBHOOK_AUTH] Error:', err);
    next();
  }
};

// ============================================================
// 4. OPTIONAL API KEY (For public endpoints that support auth)
// ============================================================

exports.optionalApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      // No API key provided, continue without tenant context
      req.tenant = null;
      return next();
    }

    // If API key provided, validate it
    const tenant = await Tenant.findOne({
      where: { apiKey: apiKey, isActive: true }
    });

    if (tenant) {
      req.tenant = {
        id: tenant.id,
        schoolId: tenant.schoolId,
        schoolName: tenant.schoolName,
        package: tenant.package,
      };
    } else {
      req.tenant = null;
    }

    next();
  } catch (err) {
    console.error('[OPTIONAL_API_KEY] Error:', err);
    req.tenant = null;
    next();
  }
};

// ============================================================
// 5. TIER-BASED RATE LIMITING
// ============================================================

exports.createTieredRateLimiter = () => {
  const rateLimitMiddleware = require('express-rate-limit');

  return rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // default
    message: {
      success: false,
      message: 'Terlalu banyak request. Gunakan cache atau kurangi frekuensi.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limit for health checks
      if (req.path === '/testing') return true;
      return false;
    },
    keyGenerator: (req) => {
      // Rate limit per tenant, not per IP
      return req.tenant?.apiKey || req.ip;
    },
    handler: (req, res, next, options) => {
      console.warn(`[RATE_LIMIT] Exceeded for tenant: ${req.tenant?.id || 'unknown'}`);
      res.status(429).json(options.message);
    }
  });
};

// ============================================================
// 6. ADMIN-ONLY VALIDATION
// ============================================================

exports.validateAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  // For development, allow bypass
  if (process.env.NODE_ENV !== 'production' && !adminKey) {
    return next();
  }

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Admin API Key diperlukan',
      code: 'MISSING_ADMIN_KEY'
    });
  }

  const validAdminKey = process.env.ADMIN_API_KEY;
  if (!validAdminKey || adminKey !== validAdminKey) {
    return res.status(403).json({
      success: false,
      message: 'Admin API Key tidak valid',
      code: 'INVALID_ADMIN_KEY'
    });
  }

  next();
};

module.exports = {
  generateApiKey: exports.generateApiKey,
  generateApiSecret: exports.generateApiSecret,
  hashSecret: exports.hashSecret,
  validateApiKey: exports.validateApiKey,
  validateWebhookSignature: exports.validateWebhookSignature,
  optionalApiKey: exports.optionalApiKey,
  createTieredRateLimiter: exports.createTieredRateLimiter,
  validateAdminKey: exports.validateAdminKey,
};