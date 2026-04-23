
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const GuruTendik = require('./guruTendik'); 

const SchoolOrganization = sequelize.define('SchoolOrganization', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'organisasi',
      key: 'id',
    },
  },
  assignedEmployeeId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'guruTendik',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true, 
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableName: 'organisasi',
});


SchoolOrganization.belongsTo(SchoolOrganization, { as: 'Parent', foreignKey: 'parentId' });
SchoolOrganization.hasMany(SchoolOrganization, { as: 'Children', foreignKey: 'parentId' });
SchoolOrganization.belongsTo(GuruTendik, { foreignKey: 'assignedEmployeeId' });

module.exports = SchoolOrganization;