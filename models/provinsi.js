// models/Provinsi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Provinsi = sequelize.define('Provinsi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kodeProvinsi: {
    type: DataTypes.STRING(2),
    allowNull: false,
    unique: true,
    validate: { len: [2, 2] }
  },
  namaProvinsi: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'provinsi',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['kodeProvinsi'] },
    { unique: true, fields: ['namaProvinsi'] },
  ],
});

module.exports = Provinsi;