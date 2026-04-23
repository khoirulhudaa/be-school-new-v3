const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VisionMission = sequelize.define('VisionMission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vision: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Misi sekarang array string
  missions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [], // default array kosong
  },
  // Pilar sekarang array string
  pillars: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  // KPI: array of { indicator: string, target: number }
  kpis: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'visionMission', // optional, biar nama table jelas
});

module.exports = VisionMission;