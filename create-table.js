require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const sql = `
  CREATE TABLE IF NOT EXISTS appreciations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schoolId INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category ENUM('AKADEMIK','NON_AKADEMIK','OLAHRAGA','SENI','ORGANISASI','LAINNYA') DEFAULT 'LAINNYA',
    poin INT DEFAULT 0,
    images TEXT,
    authorId INT,
    authorName VARCHAR(100),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

pool.query(sql, (err, result) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Table appreciations created successfully!');
  }
  pool.end();
});
