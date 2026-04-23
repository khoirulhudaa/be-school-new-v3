const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ekstrakurikuler = sequelize.define('Ekstrakurikuler', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nama ekstrakurikuler (contoh: Pramuka, Basket, Tari, dll)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  schedule: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Jadwal kegiatan (contoh: Setiap Selasa pukul 15:00)',
  },
  mentor: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nama pembina/mentor',
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'Lainnya',
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'ekstrakurikuler',
});

module.exports = Ekstrakurikuler;