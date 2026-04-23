const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BkKuis = sequelize.define('BkKuis', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  judul: { type: DataTypes.STRING, allowNull: false },
  deskripsi: { type: DataTypes.TEXT, allowNull: true },
  kategori: {
    type: DataTypes.ENUM('pribadi', 'sosial', 'belajar', 'karir'),
    allowNull: false,
    defaultValue: 'pribadi',
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: 'bk_kuis',
});

module.exports = BkKuis;