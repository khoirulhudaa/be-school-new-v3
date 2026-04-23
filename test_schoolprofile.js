require('dotenv').config();
const SchoolProfile = require('./models/profileSekolah');

console.log('SchoolProfile:', typeof SchoolProfile);
console.log('SchoolProfile.name:', SchoolProfile.name);
console.log('Is Model:', !!SchoolProfile.get);

try {
  SchoolProfile.findOne({ where: { domain: 'localhost' } })
    .then(school => {
      console.log('School query result:', school ? school.dataValues : null);
    })
    .catch(err => {
      console.error('Query error:', err.message);
    });
} catch(e) {
  console.error('Error:', e.message);
}