const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Presence = sequelize.define('Presence', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userType: { type: DataTypes.ENUM('siswa', 'guru'), allowNull: false },
  type: { type: DataTypes.ENUM('checkin', 'checkout'), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  placeId: { type: DataTypes.INTEGER },
  zoneId: { type: DataTypes.INTEGER },
  qrCode: { type: DataTypes.STRING(255) },
}, { timestamps: true, updatedAt: false, createdAt: 'createdAt' });

module.exports = Presence;
