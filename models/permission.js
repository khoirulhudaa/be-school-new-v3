const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Permission = db.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  groupName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
  isActive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true,
});

// Associations
Permission.associate = (models) => {
  Permission.belongsTo(models.PermissionGroup, { foreignKey: 'groupId', as: 'group' });
};

module.exports = Permission;