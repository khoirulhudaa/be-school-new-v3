require('dotenv').config();
const { Sequelize, Transaction } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    logging: false, 
    pool: {
      max: 5,           // Total 200 koneksi (Sangat aman untuk limit 500)
      min: 2,           // Sisakan 2 per core agar "hangat" & siap saat jam absen tiba
      idle: 10000,      // Biarkan koneksi bertahan 10 detik saat jam sibuk
      acquire: 30000,   // Jangan sampai siswa gagal absen karena timeout singkat    
      evict: 1000,
    },
    dialectOptions: {
      connectTimeout: 60000,
      decimalNumbers: true 
    },
  }
);

module.exports = sequelize;