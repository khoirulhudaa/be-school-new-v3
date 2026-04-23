const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activities = sequelize.define('Activities', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  tipe: { type: DataTypes.STRING(255) },
  jarakMeter: { type: DataTypes.FLOAT },
  durasiDetik: { type: DataTypes.INTEGER },
  kalori: { type: DataTypes.FLOAT },
  points: { type: DataTypes.JSON },
}, { timestamps: true, updatedAt: 'updatedAt' });

module.exports = Activities;
