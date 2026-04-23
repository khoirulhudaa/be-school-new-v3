const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SchoolRules = sequelize.define('SchoolRules', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rules: {
    type: DataTypes.JSON, // Array of strings or objects for rules, e.g., [{rule: 'No running in halls', description: 'Safety first'}]
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
  tableName: 'tataTertib',
});

module.exports = SchoolRules;