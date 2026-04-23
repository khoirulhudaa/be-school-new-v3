const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sos = sequelize.define('Sos', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userType: { type: DataTypes.ENUM('siswa', 'guru', 'ortu'), allowNull: false },
  // Reason is REQUIRED for SOS trigger
  reason: { type: DataTypes.STRING(100), allowNull: false, comment: 'Reason for SOS: danger, emergency, etc' },
  description: { type: DataTypes.TEXT, allowNull: true, comment: 'Optional description' },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  // For parent SOS - links to the parent's SOS id
  parentSosId: { type: DataTypes.INTEGER, allowNull: true, comment: 'If this is child SOS triggered by parent SOS' },
  status: { type: DataTypes.ENUM('pending', 'acknowledged', 'resolved'), defaultValue: 'pending' },
  acknowledgedBy: { type: DataTypes.INTEGER },
  acknowledgedAt: { type: DataTypes.DATE },
  // Resolution fields
  resolvedAt: { type: DataTypes.DATE },
  resolvedBy: { type: DataTypes.INTEGER },
  resolutionNotes: { type: DataTypes.TEXT },
}, { timestamps: true, createdAt: 'createdAt' });

module.exports = Sos;
