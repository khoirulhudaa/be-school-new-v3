const { DataTypes } = require('sequelize');
const db = require('../config/database');

const HealthRecord = db.define('HealthRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  height: {
    type: DataTypes.DECIMAL(5, 2), // cm
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2), // kg
    allowNull: true,
  },
  bloodType: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  healthNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('normal', 'need_attention', 'critical'),
    defaultValue: 'normal',
  },
}, {
  tableName: 'health_records',
  timestamps: true,
  underscored: true,
});

HealthRecord.associate = (models) => {
  HealthRecord.belongsTo(models.Siswa, { foreignKey: 'studentId', as: 'student' });
};

module.exports = HealthRecord;