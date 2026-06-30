// backend/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../seed/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://turf-1c32c-default-rtdb.firebaseio.com/'
  });
}

module.exports = admin;
