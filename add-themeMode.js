require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sql = "ALTER TABLE akunsekolah ADD COLUMN themeMode ENUM('light', 'dark') DEFAULT 'light'";

pool.query(sql, (err, result) => {
  if (err && err.message.includes('Duplicate')) {
    console.log('Column themeMode already exists');
  } else if (err) {
    console.error('Error adding column:', err.message);
  } else {
    console.log('Column themeMode added successfully!');
  }
  pool.end();
});
