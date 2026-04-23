const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  publishDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Tambahan field baru
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Umum',  // default jika tidak diisi
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Sekolah',  // contoh: 'Sekolah', 'Dinas', 'Lainnya'
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'pengumuman'
});

module.exports = Announcement;