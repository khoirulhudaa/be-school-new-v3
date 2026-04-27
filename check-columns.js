require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.query('SHOW COLUMNS FROM SchoolProfiles', (e, r) => {
  if (e) {
    console.log('Error:', e.message);
  } else {
    console.log('Columns in SchoolProfiles:');
    r.forEach(col => console.log(' -', col.Field, col.Type));
  }
  pool.end();
});
