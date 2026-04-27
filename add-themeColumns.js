require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const cols = [
  'themeDarkBg',
  'themeDarkSurface',
  'themeDarkText',
  'themeLightBg',
  'themeLightSurface'
];

let done = 0;
cols.forEach(c => {
  const sql = `ALTER TABLE SchoolProfiles ADD COLUMN ${c} VARCHAR(50) DEFAULT NULL`;
  pool.query(sql, (e) => {
    if (e && e.message.includes('Duplicate')) {
      console.log(c + ' exists');
    } else if (e) {
      console.log('Error ' + c + ':', e.message);
    } else {
      console.log('Added ' + c);
    }
    if (++done === cols.length) pool.end();
  });
});
