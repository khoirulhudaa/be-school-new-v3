const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kunjungan = sequelize.define('Kunjungan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ortuId: { type: DataTypes.INTEGER, allowNull: false },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  tanggalKunjungan: { type: DataTypes.DATE, allowNull: false },
  keperluan: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending', 'approved', 'completed', 'cancelled'), defaultValue: 'pending' },
}, { timestamps: true, updatedAt: 'updatedAt' });

module.exports = Kunjungan;
