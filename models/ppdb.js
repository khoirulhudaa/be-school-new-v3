// models/ppdb.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ppdb = sequelize.define('Ppdb', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  admissionPaths: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [], // Struktur: [{ name: "Zonasi", quota: "50%", description: "..." }]
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  requirements: {
    type: DataTypes.JSON,          
    allowNull: true,
    defaultValue: [],             
  },
  quota: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true },
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'ppdb',
});

module.exports = Ppdb;