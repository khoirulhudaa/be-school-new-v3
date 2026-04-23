const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// School-level zones
const SchoolZones = sequelize.define('SchoolZones', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false, field: 'school_id' },
  name: { type: DataTypes.STRING(100), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  radius: { type: DataTypes.INTEGER, defaultValue: 100, field: 'radius_m' },
  type: { type: DataTypes.ENUM('sekolah', 'gedung', 'kantin', 'lapangan'), defaultValue: 'sekolah' },
  isPrimary: { type: DataTypes.TINYINT, defaultValue: 0, field: 'is_primary' },
}, { timestamps: true, updatedAt: false, createdAt: 'created_at' });

// Parent-created safe zones for their children
const SafeZones = sequelize.define('SafeZones', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  parentId: { type: DataTypes.INTEGER, allowNull: false, field: 'parent_id' },
  siswaId: { type: DataTypes.INTEGER, allowNull: false, field: 'siswa_id' },
  name: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Rumah' },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  radius: { type: DataTypes.INTEGER, defaultValue: 200, field: 'radius_m' },
  isActive: { type: DataTypes.TINYINT, defaultValue: 1, field: 'is_active' },
}, { timestamps: true, updatedAt: 'updated_at', createdAt: 'created_at' });

// Zone alerts when child exits/enters zone
const ZoneAlerts = sequelize.define('ZoneAlerts', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  safeZoneId: { type: DataTypes.INTEGER, allowNull: false, field: 'safe_zone_id' },
  siswaId: { type: DataTypes.INTEGER, allowNull: false, field: 'siswa_id' },
  alertType: { type: DataTypes.ENUM('out_of_zone', 'back_in_zone', 'sos'), allowNull: false, field: 'alert_type' },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  locationAddress: { type: DataTypes.STRING(255), field: 'location_address' },
  isRead: { type: DataTypes.TINYINT, defaultValue: 0, field: 'is_read' },
  readAt: { type: DataTypes.DATE, field: 'read_at' },
}, { timestamps: true, updatedAt: false, createdAt: 'created_at' });

module.exports = { SchoolZones, SafeZones, ZoneAlerts };
