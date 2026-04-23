const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SchoolAccount = require('./auth');

const Tugas = sequelize.define('Tugas', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  judul: {
    type: DataTypes.STRING,
    allowNull: false
  },
  namaGuru: { // Baru
    type: DataTypes.STRING,
    allowNull: false
  },
  emailGuru: { // Baru
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  jenisSoal: { // Baru (Contoh: Pilihan Ganda, Essay, Praktik)
    type: DataTypes.STRING,
    allowNull: false
  },
  kelas: { // Baru (Contoh: Pilihan Ganda, Essay, Praktik)
    type: DataTypes.STRING,
    allowNull: false
  },
  mapel: { // Baru (Contoh: Pilihan Ganda, Essay, Praktik)
    type: DataTypes.STRING,
    allowNull: false
  },
  nilaiMinimal: { // Baru (KKM)
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  linkEksternal: { // Baru (Link Drive, Zoom, dll)
    type: DataTypes.STRING,
    allowNull: true
  },
  hari: { // Baru (Contoh: Senin)
    type: DataTypes.STRING,
    allowNull: false
  },
  tanggal: { // Baru (Hanya Tanggal)
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  deadlineJam: { // Baru (Jam pengumpulan)
    type: DataTypes.TIME,
    allowNull: false
  },
}, {
  timestamps: true,
  tableName: 'tugas',
  indexes: [
    // 1. Indexing untuk Foreign Key & Filter Utama
    {
      name: 'idx_tugas_school_id',
      fields: ['schoolId']
    },
    // 2. Indexing untuk Pencarian Nama Guru (iLike/Like)
    {
      name: 'idx_tugas_nama_guru',
      fields: ['namaGuru']
    },
    // 3. Indexing Komposit untuk Sorting (Tanggal & Jam)
    // Sangat berguna untuk performa query getAllTugas yang pakai 'ORDER BY'
    {
      name: 'idx_tugas_deadline',
      fields: ['tanggal', 'deadlineJam']
    },
    // 4. Indexing untuk filter kategori
    {
      name: 'idx_tugas_jenis_soal',
      fields: ['jenisSoal']
    }
  ]
});

SchoolAccount.hasMany(Tugas, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
Tugas.belongsTo(SchoolAccount, { foreignKey: 'schoolId' });

module.exports = Tugas;