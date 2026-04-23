const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path config sesuai

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  className: {
    type: DataTypes.STRING,
    allowNull: false
  },
   waliKelas: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  waliKelasPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Format: 628xxxxxxxxxx (tanpa + atau 0)'
  },
  waliKelasEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  }
}, {
  tableName: 'kelas', // Nama tabel di database
  timestamps: true      // Menghasilkan createdAt & updatedAt
});

// --- DEFINE RELATIONS ---
Class.associate = (models) => {
  // Satu Kelas memiliki banyak Siswa
  Class.hasMany(models.Student, {
    foreignKey: 'classId',
    as: 'students'
  });
};

module.exports = Class;