const { DataTypes } = require('sequelize');
const db = require('../config/database');

const UserRole = db.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_roles',
  timestamps: true,
  underscored: true,
});

module.exports = UserRole;