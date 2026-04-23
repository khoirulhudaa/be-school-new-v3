const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BkJadwal = sequelize.define('BkJadwal', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  schoolId: { type: DataTypes.INTEGER, allowNull: false },
  hasilId: { type: DataTypes.INTEGER, allowNull: true, comment: 'Bisa dibuat dari hasil kuis atau manual' },
  siswaId: { type: DataTypes.INTEGER, allowNull: false },
  namaSiswa: { type: DataTypes.STRING, allowNull: false },
  kelasSiswa: { type: DataTypes.STRING, allowNull: true },
  judulPertemuan: { type: DataTypes.STRING, allowNull: false },
  deskripsi: { type: DataTypes.TEXT, allowNull: true },
  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  jamMulai: { type: DataTypes.TIME, allowNull: false },
  jamSelesai: { type: DataTypes.TIME, allowNull: false },
  lokasi: { type: DataTypes.STRING, allowNull: true },
  status: {
    type: DataTypes.ENUM('terjadwal', 'selesai', 'dibatalkan'),
    defaultValue: 'terjadwal',
  },
  catatan: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: 'bk_jadwal',
});

module.exports = BkJadwal;