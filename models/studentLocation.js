const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentLocation = sequelize.define('StudentLocation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'school_id'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'GPS accuracy in meters'
  },
  status: {
    type: DataTypes.ENUM('arrived', 'departed', 'emergency'),
    defaultValue: 'arrived',
    comment: 'Student status when location was recorded'
  },
  source: {
    type: DataTypes.ENUM('app', 'manual', 'auto'),
    defaultValue: 'app',
    comment: 'How location was recorded'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes'
  },
  parentConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether parent has given consent for location tracking'
  },
  consentTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When parent gave consent'
  },
  consentIp: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address when consent was given'
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  tableName: 'student_locations'
});

module.exports = StudentLocation;