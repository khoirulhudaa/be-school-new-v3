const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false, unique: true },

  // School Info
  schoolName: { type: DataTypes.STRING(255), allowNull: false },
  domain: { type: DataTypes.STRING(255) }, // smkn5.sch.id

  // API Access
  apiKey: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  apiSecret: { type: DataTypes.STRING(255) }, // hashed

  // Security
  allowedIps: { type: DataTypes.JSON, defaultValue: [] },
  allowedDomains: { type: DataTypes.JSON, defaultValue: [] },

  // Rate Limits
  rateLimitRequests: { type: DataTypes.INTEGER, defaultValue: 100 }, // per window
  rateLimitWindow: { type: DataTypes.INTEGER, defaultValue: 60000 }, // ms

  // Subscription
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'expired', 'trial'),
    defaultValue: 'active'
  },
  subscriptionStart: { type: DataTypes.DATE },
  subscriptionEnd: { type: DataTypes.DATE },
  package: { type: DataTypes.STRING(50), defaultValue: 'basic' },

  // Usage Tracking
  storageUsed: { type: DataTypes.BIGINT, defaultValue: 0 },
  storageLimit: { type: DataTypes.BIGINT, defaultValue: 500 * 1024 * 1024 }, // 500MB
  bandwidthUsed: { type: DataTypes.BIGINT, defaultValue: 0 },
  bandwidthLimit: { type: DataTypes.BIGINT, defaultValue: 10 * 1024 * 1024 * 1024 }, // 10GB

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

  // Metadata
  registeredBy: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },

  // Security Log
  lastAccessAt: { type: DataTypes.DATE },
  lastIP: { type: DataTypes.STRING(50) },
  accessCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// Instance method untuk keamanan
Tenant.prototype.recordAccess = function(ip) {
  this.lastAccessAt = new Date();
  this.lastIP = ip;
  this.accessCount += 1;
  return this.save();
};

// Static method untuk generate credentials
Tenant.generateCredentials = function() {
  const crypto = require('crypto');
  const timestamp = Date.now();

  return {
    apiKey: `tenant-${timestamp}-${crypto.randomBytes(16).toString('hex')}`,
    apiSecret: crypto.randomBytes(32).toString('hex')
  };
};

// Hash secret for storage
Tenant.hashSecret = function(secret) {
  return require('crypto')
    .createHash('sha256')
    .update(secret)
    .digest('hex');
};

module.exports = Tenant;