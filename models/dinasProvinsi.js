// models/DinasProvinsi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DinasProvinsi = sequelize.define('DinasProvinsi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kodeDinas: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  namaDinas: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  provinsiId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'provinsi',
      key: 'id'
    }
  },
  alamat: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  telepon: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'dinasProvinsi',
  timestamps: true,
});

module.exports = DinasProvinsi;