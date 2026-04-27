// fix_alumni.js - Run with: node fix_alumni.js
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: '112.78.143.92',
    user: 'be-school_db',
    password: '73ibH7GHpiknANyp',
    database: 'be-school_db'
  });

  console.log('Connected to database...');

  const columns = [
    { name: 'isFeatured', sql: 'BOOLEAN DEFAULT FALSE' },
    { name: 'hasStory', sql: 'BOOLEAN DEFAULT FALSE' },
    { name: 'university', sql: 'VARCHAR(255) NULL' },
    { name: 'currentJob', sql: 'VARCHAR(255) NULL' },
    { name: 'story', sql: 'TEXT NULL' },
    { name: 'contact', sql: 'VARCHAR(255) NULL' }
  ];

  for (const col of columns) {
    try {
      // Check if column exists
      const [rows] = await conn.query(`SHOW COLUMNS FROM alumni LIKE '${col.name}'`);
      if (rows.length === 0) {
        await conn.query(`ALTER TABLE alumni ADD COLUMN ${col.name} ${col.sql}`);
        console.log(`Added column: ${col.name}`);
      } else {
        console.log(`Column already exists: ${col.name}`);
      }
    } catch (e) {
      console.error(`Error adding ${col.name}:`, e.message);
    }
  }

  console.log('Migration complete!');
  await conn.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
