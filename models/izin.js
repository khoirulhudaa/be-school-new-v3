// module.exports = (sequelize, DataTypes) => {
//   const Izin = sequelize.define('Izin', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     siswaId: { type: DataTypes.INTEGER, allowNull: false },
//     jenis: { type: DataTypes.ENUM('sakit', 'dispensasi', 'keluarga'), allowNull: false },
//     tanggalMulai: { type: DataTypes.DATEONLY, allowNull: false },
//     tanggalAkhir: { type: DataTypes.DATEONLY, allowNull: false },
//     deskripsi: { type: DataTypes.TEXT },
//     lampiranUrl: { type: DataTypes.STRING(255) },
//     status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
//     approvedBy: { type: DataTypes.INTEGER },
//     approvedAt: { type: DataTypes.DATE },
//     // Recurring fields
//     isRecurring: { type: DataTypes.TINYINT, defaultValue: 0 },
//     recurringType: { type: DataTypes.ENUM('weekly', 'monthly') },
//     recurringEndDate: { type: DataTypes.DATEONLY },
//     recurringParentId: { type: DataTypes.INTEGER },
//     recurringGroupId: { type: DataTypes.STRING(64) },
//   }, { tableName: 'izin', timestamps: true });

//   Izin.associate = (models) => {
//     Izin.belongsTo(models.siswa, { foreignKey: 'siswaId', as: 'siswa' });
//   };

//   return Izin;
// };


const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Izin = sequelize.define('Izin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  jenis: { type: DataTypes.ENUM('sakit', 'dispensasi', 'keluarga'), allowNull: false },
  tanggalMulai: { type: DataTypes.DATEONLY, allowNull: false },
  tanggalAkhir: { type: DataTypes.DATEONLY, allowNull: false },
  deskripsi: { type: DataTypes.TEXT },
  lampiranUrl: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  approvedBy: { type: DataTypes.INTEGER },
  approvedAt: { type: DataTypes.DATE },
  isRecurring: { type: DataTypes.TINYINT, defaultValue: 0 },
  recurringType: { type: DataTypes.ENUM('weekly', 'monthly') },
  recurringEndDate: { type: DataTypes.DATEONLY },
  recurringParentId: { type: DataTypes.INTEGER },
  recurringGroupId: { type: DataTypes.STRING(64) },
}, {
  tableName: 'izin',
  timestamps: true
});

// Tambahkan ini — lazy require untuk hindari circular dependency
const Siswa = require('./siswa'); // sesuaikan nama file
Izin.belongsTo(Siswa, { foreignKey: 'siswaId', as: 'siswa' });

module.exports = Izin;