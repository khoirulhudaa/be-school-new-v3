const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SponsorBanners = sequelize.define('SponsorBanners', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, field: 'schoolId' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  subtitle: { type: DataTypes.STRING(500) },
  bgColorStart: { type: DataTypes.STRING(20), defaultValue: '#1B5E20', field: 'bgColorStart' },
  bgColorEnd: { type: DataTypes.STRING(20), defaultValue: '#2E7D32', field: 'bgColorEnd' },
  textColor: { type: DataTypes.STRING(20), defaultValue: '#FFFFFF', field: 'textColor' },
  accentColor: { type: DataTypes.STRING(20), defaultValue: '#FFFFEB3B', field: 'accentColor' },
  imageUrl: { type: DataTypes.STRING(500), field: 'imageUrl' },
  actionUrl: { type: DataTypes.STRING(500), field: 'actionUrl' },
  actionLabel: { type: DataTypes.STRING(100), field: 'actionLabel' },
  bannerType: { type: DataTypes.STRING(50), defaultValue: 'sponsor', field: 'bannerType' },
  displayDurationSeconds: { type: DataTypes.INTEGER, defaultValue: 10, field: 'displayDurationSeconds' },
  displayOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'displayOrder' },
  isActive: { type: DataTypes.TINYINT, defaultValue: 1, field: 'isActive' },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

module.exports = SponsorBanners;
