const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BannerPricing = sequelize.define('BannerPricing', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  planId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'planId',
    comment: 'basic | premium | platinum',
  },
  name: { type: DataTypes.STRING(100), allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  period: { type: DataTypes.STRING(50), defaultValue: 'per bulan' },
  views: { type: DataTypes.STRING(100), defaultValue: '' },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'durasi tampil dalam detik',
  },
  maxBanners: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3, field: 'maxBanners' },
  commissionFee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 2,
    field: 'commissionFee',
    comment: 'Fee operator dalam persen',
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of feature strings',
  },
  isActive: { type: DataTypes.TINYINT, defaultValue: 1, field: 'isActive' },
}, {
  timestamps: true,
  tableName: 'BannerPricing',
});

module.exports = BannerPricing;