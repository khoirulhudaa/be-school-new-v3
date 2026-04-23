const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Asumsi model Sekolah ada di folder sekolah atau path lain
const Sekolah = require('../models/auth');     // sesuaikan path
const SukuDinas = require('../models/SukuDinas');   // sesuaikan path

const SchoolSukuDinas = sequelize.define('SchoolSukuDinas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'akunSekolah', key: 'id' }  // nama table sekolah
  },
  sukuDinasId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'sukuDinas', key: 'id' }
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
  tableName: 'sekolahSukuDinas', 
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['schoolId', 'sukuDinasId']
    }
  ]
});

// === Tambahkan relasi (sangat disarankan) ===
SchoolSukuDinas.belongsTo(Sekolah, {
  foreignKey: 'schoolId',
  as: 'sekolah'
});

SchoolSukuDinas.belongsTo(SukuDinas, {
  foreignKey: 'sukuDinasId',
  as: 'sukuDinas'
});

// Opsional: relasi balik (jika diperlukan di model utama)
Sekolah.hasMany(SchoolSukuDinas, {
  foreignKey: 'schoolId',
  as: 'assignedSudins'
});

SukuDinas.hasMany(SchoolSukuDinas, {
  foreignKey: 'sukuDinasId',
  as: 'assignedSchools'
});

module.exports = SchoolSukuDinas;