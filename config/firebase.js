const admin = require('firebase-admin');
const serviceAccount = require('./disco-history-430508-e3-firebase-adminsdk-rns1y-ea99cd7fad.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;