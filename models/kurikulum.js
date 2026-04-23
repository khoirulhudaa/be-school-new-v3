const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curriculum = sequelize.define('Curriculum', {
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
    allowNull: false,  // Contoh: "Kurikulum Merdeka 2022", "K13 Revisi"
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,  // Tahun penerapan, misal 2022
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,  // Contoh: "Kurikulum Merdeka", "K13", "KTSP"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,   // Link Google Drive, situs resmi, atau URL upload
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'kurikulum',
});

module.exports = Curriculum;