const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Catatan = sequelize.define('Catatan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  judul: { type: DataTypes.STRING(255) },
  isi: { type: DataTypes.TEXT },
  warna: { type: DataTypes.STRING(20), defaultValue: '#FFFFF9C4' },
  tanggal: { type: DataTypes.DATE },
  isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
  isChecklist: { type: DataTypes.BOOLEAN, defaultValue: false },
  checklist: { type: DataTypes.JSON }, // array of {text, done}
  labels: { type: DataTypes.JSON }, // array of strings
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

const CatatanGuru = sequelize.define('CatatanGuru', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  guruId: { type: DataTypes.INTEGER, allowNull: false },
  siswaId: { type: DataTypes.INTEGER },
  judul: { type: DataTypes.STRING(255) },
  isi: { type: DataTypes.TEXT },
  warna: { type: DataTypes.STRING(20), defaultValue: '#FFFFF9C4' },
  tanggal: { type: DataTypes.DATE },
  isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
  isChecklist: { type: DataTypes.BOOLEAN, defaultValue: false },
  checklist: { type: DataTypes.JSON },
  labels: { type: DataTypes.JSON },
}, { timestamps: true, updatedAt: 'updatedAt', createdAt: 'createdAt' });

module.exports = { Catatan, CatatanGuru };