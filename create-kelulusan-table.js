require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sql = `
  CREATE TABLE IF NOT EXISTS kelulusans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schoolId INT NOT NULL,
    nama VARCHAR(255) NOT NULL COMMENT 'Nama lengkap siswa',
    nisn VARCHAR(20) NOT NULL COMMENT 'NISN 10 digit',
    nis VARCHAR(20) NOT NULL COMMENT 'NIS Sekolah',
    jenjang ENUM('SD', 'SMP', 'SMA', 'SMK') NOT NULL COMMENT 'Jenjang pendidikan',
    jurusan VARCHAR(100) DEFAULT NULL COMMENT 'Jurusan/Paket Keahlian (untuk SMA/SMK)',
    kelas VARCHAR(50) NOT NULL COMMENT 'Kelas terakhir',
    tahunLulus INT NOT NULL COMMENT 'Tahun kelulusan',
    noIjazah VARCHAR(50) DEFAULT NULL COMMENT 'Nomor Ijazah',
    status ENUM('lulus', 'tunda', 'mengulang') DEFAULT 'tunda' COMMENT 'lulus=Printable, tunda=Belum bisa, mengulang=Harus ulangi',
    catatanAdmin TEXT DEFAULT NULL COMMENT 'Catatan dari admin',
    nomorSurat VARCHAR(50) DEFAULT NULL COMMENT 'Nomor surat keterangan lulus',
    ttdKepalaSekolah VARCHAR(255) DEFAULT NULL COMMENT 'Nama Kepala Sekolah',
    nipKepalaSekolah VARCHAR(30) DEFAULT NULL COMMENT 'NIP Kepala Sekolah',
    ttdTataUsaha VARCHAR(255) DEFAULT NULL COMMENT 'Nama Kepala Tata Usaha',
    nipTataUsaha VARCHAR(30) DEFAULT NULL COMMENT 'NIP Kepala Tata Usaha',
    kopSuratUrl VARCHAR(500) DEFAULT NULL COMMENT 'URL kop surat',
    ipAddress VARCHAR(50) DEFAULT NULL,
    userAgent VARCHAR(500) DEFAULT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_nisn (nisn),
    INDEX idx_schoolId (schoolId),
    INDEX idx_tahunLulus (tahunLulus),
    INDEX idx_jenjang (jenjang),
    INDEX idx_status (status),
    INDEX idx_school_tahun (schoolId, tahunLulus),
    INDEX idx_school_status (schoolId, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

pool.query(sql, (err, result) => {
  if (err) {
    console.error('Error creating table kelulusans:', err.message);
    process.exit(1);
  } else {
    console.log('Table kelulusans created successfully!');
  }
  pool.end();
});
