require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sql = 'ALTER TABLE SchoolProfiles ADD COLUMN themeMode ENUM("light", "dark") DEFAULT "light"';

pool.query(sql, (err, result) => {
  if (err && err.message.includes('Duplicate')) {
    console.log('Column themeMode already exists in SchoolProfiles');
  } else if (err) {
    console.error('Error adding column:', err.message);
  } else {
    console.log('Column themeMode added to SchoolProfiles!');
  }
  pool.end();
});
