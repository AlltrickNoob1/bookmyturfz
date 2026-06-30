const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Put your service account key at seed/serviceAccountKey.json (do NOT commit it)
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('serviceAccountKey.json not found in seed/. Put the key file there and re-run this script.');
  process.exit(1);
}
const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://turf-1c32c-default-rtdb.firebaseio.com'
});

const db = admin.database();

const seed = {
  users: {
    demoUserUid1: {
      data: {
        booking: {
          name: 'Greenfield Turf',
          address: '123 Turf St, Kottayam',
          image: 'https://placehold.co/600x400.png?text=Greenfield+Turf'
        },
        time: '7:00 AM',
        bookingDate: '2025-12-01',
        uid: 'demoUserUid1',
        email: 'user1@example.com'
      }
    }
  }
};

async function seedRealtimeDB() {
  try {
    // replace root with seed (clears previous data)
    await db.ref('/').set(seed);
    console.log('Realtime DB seed applied (replaced root).');
    process.exit(0);
  } catch (err) {
    console.error('Realtime seed error:', err);
    process.exit(1);
  }
}

seedRealtimeDB();
