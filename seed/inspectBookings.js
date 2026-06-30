const admin = require('firebase-admin');
const path = require('path');

const SERVICE_KEY = path.join(__dirname, '..', 'YOUR_SERVICE_KEY');

try {
  const serviceAccount = require(SERVICE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://turf-1c32c-default-rtdb.firebaseio.com'
  });
} catch (err) {
  console.error('Failed to load service account. Ensure the JSON exists at project root with correct name.');
  console.error(err.message);
  process.exit(1);
}

const db = admin.database();
const targetEmails = [
  'ENTER_YOUR_TARGET_EMAIL',
  'ENTER_YOUR_TARGET_EMAIL'
];

async function inspect() {
  try {
    const snap = await db.ref('users').once('value');
    const data = snap.val();
    if (!data) {
      console.log('No users found in Realtime DB at /users');
      process.exit(0);
    }

    const matches = [];
    Object.entries(data).forEach(([uid, userData]) => {
      // check current data block
      if (userData.data) {
        const email = userData.data.email || userData.data.uid || null;
        if (email && targetEmails.includes(email)) {
          matches.push({ uid, type: 'current', record: userData.data });
        }
      }

      // check historic bookings
      if (userData.bookings) {
        Object.entries(userData.bookings).forEach(([bkKey, bk]) => {
          const email = bk.email || (bk.data && bk.data.email) || null;
          if (email && targetEmails.includes(email)) {
            matches.push({ uid, type: 'history', bookingKey: bkKey, record: bk });
          }
        });
      }
    });

    if (matches.length === 0) {
      console.log('No bookings found for target emails.');
    } else {
      console.log(`Found ${matches.length} matching booking(s):`);
      matches.forEach((m, i) => {
        console.log('---');
        console.log(`#${i+1} UID: ${m.uid} Type: ${m.type} BookingKey: ${m.bookingKey || 'N/A'}`);
        console.log(JSON.stringify(m.record, null, 2));
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error reading Realtime DB:', err.message || err);
    process.exit(1);
  }
}

inspect();
