const { DataTypes } = require('sequelize');
const db = require('../config/database');

const HealthScreening = db.define('HealthScreening', {
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
  screeningDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  result: {
    type: DataTypes.ENUM('normal', 'abnormal', 'needs_follow_up'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'health_screenings',
  timestamps: true,
  underscored: true,
});

HealthScreening.associate = (models) => {
  HealthScreening.belongsTo(models.Siswa, { foreignKey: 'studentId', as: 'student' });
};

module.exports = HealthScreening;