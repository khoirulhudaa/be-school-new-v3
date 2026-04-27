/**
 * Security Middleware - Anti SQL Injection & XSS Protection
 * Untuk backend be_school_new
 */

const sanitizeHtml = require('sanitize-html');
const { Op } = require('sequelize');

// ============================================================
// 1. SQL INJECTION PATTERNS - untuk deteksi pattern berbahaya
// ============================================================
const SQL_INJECTION_PATTERNS = [
  // SQL Keywords
  /(\b)(select\b|union\b|insert\b|update\b|delete\b|drop\b|create\b|alter\b|truncate\b|exec\b|execute\b|script\b|shutdown\b|grant\b|revoke\b)/gi,
  // Comment-based attacks
  /(--|#|\/\*|\*\/)/,
  // Common injection chars
  /('|"|;|\\|--|\/\*|\*\/|@@|@|char\b|nchar\b|varchar\b|nvarchar\b|alter\b|begin\b|cast\b|create\b|cursor\b|declare\b|delete\b|drop\b|end\b|exec\b|execute\b|fetch\b|insert\b|kill\b|open\b|select\b|sys\.|sysobjects\b|syscolumns\b|table\b|update\b|xp_)/gi,
  // Hex encoding attempts
  /(0x[0-9a-f]+)/gi,
  // OR / AND injection
  /(\bOR\b.*=.*|\bAND\b.*=.*)/i,
  // UNION-based injection
  /(\bUNION\b.*\bSELECT\b|\bUNION\b.*\bALL\b)/i,
];

// ============================================================
// 2. XSS PATTERNS - untuk deteksi script injection
// ============================================================
const XSS_PATTERNS = [
  /<script\b/i,
  /<\/script>/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /onblur\s*=/i,
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /<svg/i,
  /on\w+\s*=/i,
  /data:/i,
  /<link/i,
  /<meta/i,
];

// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

/**
 * Check for SQL injection patterns in a string
 */
function detectSQLInjection(input) {
  if (typeof input !== 'string') return false;

  // Remove quotes temporarily for check but keep track
  const normalized = input.replace(/'/g, '').replace(/"/g, '');

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Check for stacked queries
  if (input.includes(';') && /\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b/i.test(input)) {
    return true;
  }

  // Check for hex encoding
  if (/0x[0-9a-f]{8,}/i.test(input)) {
    return true;
  }

  return false;
}

/**
 * Check for XSS patterns in a string
 */
function detectXSS(input) {
  if (typeof input !== 'string') return false;

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }

  // Check for encoded XSS
  const decoded = decodeURIComponent(input);
  if (decoded !== input && detectXSS(decoded)) {
    return true;
  }

  return false;
}

/**
 * Sanitize string for XSS protection (HTML)
 */
function sanitizeXSS(input) {
  if (typeof input !== 'string') return input;

  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    allowedStyles: {},
  });
}

/**
 * Escape special characters for SQL
 * NOTE: Sequelize ORM already handles parameterized queries,
 * but this provides extra protection for raw queries
 */
function escapeSQLString(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/['"\\]/g, '\\$&');
}

/**
 * Validate numeric ID
 */
function isValidNumericId(value) {
  const num = parseInt(value);
  return !isNaN(num) && num > 0 && num < 2147483647; // Max INT
}

// ============================================================
// 4. EXPRESS MIDDLEWARE FUNCTIONS
// ============================================================

/**
 * Main security middleware - check all request inputs
 */
exports.securityMiddleware = (req, res, next) => {
  try {
    let threatDetected = false;
    let threatType = null;

    // Check query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          if (detectSQLInjection(value)) {
            threatDetected = true;
            threatType = 'SQL_INJECTION';
            break;
          }
          if (detectXSS(value)) {
            threatDetected = true;
            threatType = 'XSS';
            break;
          }
        }
      }
    }

    // Check body parameters
    if (!threatDetected && req.body) {
      threatDetected = checkObjectRecursive(req.body);
      if (threatDetected) {
        threatType = 'SQL_INJECTION';
      }
    }

    if (threatDetected) {
      console.warn(`[SECURITY] ${threatType} attempt detected from ${req.ip}`);
      console.warn(`[SECURITY] Path: ${req.path} | Method: ${req.method}`);
      console.warn(`[SECURITY] User-Agent: ${req.headers['user-agent']}`);

      return res.status(403).json({
        success: false,
        message: 'Request blocked: potential security threat detected',
        code: 'SECURITY_VIOLATION'
      });
    }

    next();
  } catch (err) {
    console.error('[SECURITY] Middleware error:', err);
    next(); // Continue anyway to not block legitimate requests
  }
};

/**
 * Recursive check object for threats
 */
function checkObjectRecursive(obj, depth = 0) {
  if (depth > 10) return false; // Prevent infinite recursion

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (detectSQLInjection(value) || detectXSS(value)) {
        return true;
      }
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            if (detectSQLInjection(item) || detectXSS(item)) {
              return true;
            }
          } else if (typeof item === 'object') {
            if (checkObjectRecursive(item, depth + 1)) {
              return true;
            }
          }
        }
      } else {
        if (checkObjectRecursive(value, depth + 1)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Sanitize body inputs for XSS
 * Use this AFTER securityMiddleware passes
 */
exports.sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObjectRecursive(req.body);
  }
  next();
};

/**
 * Recursive sanitize object
 */
function sanitizeObjectRecursive(obj, depth = 0) {
  if (depth > 10) return;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      obj[key] = sanitizeXSS(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitizeObjectRecursive(value, depth + 1);
    }
    // Arrays: sanitize each string element
    else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') {
          value[i] = sanitizeXSS(value[i]);
        }
      }
    }
  }
}

/**
 * Validate ID parameters
 */
exports.validateIdParam = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (id && !isValidNumericId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} parameter`,
        code: 'INVALID_ID'
      });
    }

    next();
  };
};

/**
 * Validate query ID parameters
 */
exports.validateQueryId = (paramName) => {
  return (req, res, next) => {
    const id = req.query[paramName];

    if (id && !isValidNumericId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} query parameter`,
        code: 'INVALID_ID'
      });
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter',
        code: 'INVALID_PAGINATION'
      });
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 1000',
        code: 'INVALID_LIMIT'
      });
    }
  }

  next();
};

/**
 * Input length validator
 */
exports.validateInputLength = (fieldConfig) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, config] of Object.entries(fieldConfig)) {
      let value;

      if (req.body && req.body[field] !== undefined) {
        value = req.body[field];
      } else if (req.query && req.query[field] !== undefined) {
        value = req.query[field];
      }

      if (value !== undefined) {
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else {
          if (config.min && value.length < config.min) {
            errors.push(`${field} must be at least ${config.min} characters`);
          }
          if (config.max && value.length > config.max) {
            errors.push(`${field} must be at most ${config.max} characters`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
        code: 'VALIDATION_ERROR'
      });
    }

    next();
  };
};

// ============================================================
// 5. RATE LIMITING CONFIGURATION
// ============================================================

/**
 * Create strict rate limiter for auth endpoints
 */
exports.createAuthLimiter = (rateLimit) => {
  const rateLimitMiddleware = require('express-rate-limit');

  return rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: rateLimit || 5, // 5 attempts per 15 minutes (strict for auth)
    message: {
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    handler: (req, res, next, options) => {
      console.warn(`[RATE_LIMIT] Auth attempt exceeded from ${req.ip}`);
      res.status(429).json(options.message);
    }
  });
};

/**
 * Create general API rate limiter
 */
exports.createAPILimiter = (maxRequests = 100) => {
  const rateLimitMiddleware = require('express-rate-limit');

  return rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: maxRequests, // 100 requests per minute
    message: {
      success: false,
      message: 'Terlalu banyak request. Silakan tunggu sebentar.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      console.warn(`[RATE_LIMIT] API limit exceeded from ${req.ip}: ${req.path}`);
      res.status(429).json(options.message);
    }
  });
};

// ============================================================
// 6. EXPORT HELPERS (for use in controllers)
// ============================================================

module.exports = {
  detectSQLInjection,
  detectXSS,
  sanitizeXSS,
  escapeSQLString,
  isValidNumericId,
  securityMiddleware: exports.securityMiddleware,
  sanitizeBody: exports.sanitizeBody,
  validateIdParam: exports.validateIdParam,
  validateQueryId: exports.validateQueryId,
  validatePagination: exports.validatePagination,
  validateInputLength: exports.validateInputLength,
  createAuthLimiter: exports.createAuthLimiter,
  createAPILimiter: exports.createAPILimiter,
};