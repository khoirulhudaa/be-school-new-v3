const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  schoolId: {
    type: DataTypes.INTEGER,
    primaryKey: true, // Satu sekolah hanya punya satu baris pengaturan
    allowNull: false,
  },
  showRatingStats: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Default rating ditampilkan
    allowNull: false,
  },
}, {
  tableName: 'settingRating',
  timestamps: true, // Untuk melihat kapan terakhir setting diubah
});

module.exports = Setting;