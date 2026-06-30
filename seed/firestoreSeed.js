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
});

const db = admin.firestore();

// Example seed data — update fields to match your app schema
const seedData = {
  cricket: [
    {
      name: 'Greenfield Turf',
      address: '123 Turf St, Kottayam',
      image: 'https://images.unsplash.com/photo-1624526267942-ab67cb7db225?w=600&h=400&fit=crop',
      price: 500,
    },
    {
      name: 'Stadium Turf',
      address: '456 Arena Rd, Kottayam',
      image: 'https://images.unsplash.com/photo-1598588273900-11b9c441a81c?w=600&h=400&fit=crop',
      price: 600,
    },
  ],
  football: [
    {
      name: 'Goal Arena',
      address: '78 Pitch Ave, Bhiwandi',
      city: 'Bhiwandi',
      image: 'https://images.unsplash.com/photo-1552109066-5eb266e8a717?w=600&h=400&fit=crop',
      price: 700,
    },
    {
      name: 'Elite Football Ground',
      address: '89 Sport Lane, Mira Road',
      city: 'Mira Road',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
      price: 800,
    },
     {
      name: 'Kings Goal Arena ',
      address: '78 Pitch Ave, Kottayam',
      image: 'https://images.unsplash.com/photo-1518611505868-48abc8a4c07f?w=600&h=400&fit=crop',
      price: 650,
    },
    {
      name: 'Queens Elite Football Ground',
      address: '89 Sport Lane, Kottayam',
      image: 'https://images.unsplash.com/photo-1575361204480-aadea25c9338?w=600&h=400&fit=crop',
      price: 750,
    },
  ],
  basketball: [
    {
      name: 'Hoop Court',
      address: '101 Court Rd, Kottayam',
      image: 'https://images.unsplash.com/photo-1546519638-68711109d298?w=600&h=400&fit=crop',
      price: 550,
    },
    {
      name: 'Pro Basketball Hall',
      address: '202 Sports Complex, Kottayam',
      image: 'https://images.unsplash.com/photo-1546519638-68711109d298?w=600&h=400&fit=crop',
      price: 650,
    },
  ],
  badminton: [
    {
      name: 'Smash Court',
      address: '303 Racquet St, Kottayam',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
      price: 400,
    },
    {
      name: 'Champion Badminton Hall',
      address: '404 Tournament Ave, Kottayam',
      image: 'https://images.unsplash.com/photo-1598588273900-11b9c441a81c?w=600&h=400&fit=crop',
      price: 450,
    },
  ],
};

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batchSize = snapshot.size;
  if (batchSize === 0) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared collection ${collectionName}`);
}

async function seedFirestore() {
  try {
    // clear collections first
    for (const collectionName of Object.keys(seedData)) {
      await clearCollection(collectionName);
    }

    for (const [collectionName, docs] of Object.entries(seedData)) {
      for (const doc of docs) {
        const res = await db.collection(collectionName).add(doc);
        console.log(`Added ${collectionName}/${res.id}`);
      }
    }
    console.log('Firestore seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Firestore:', err);
    process.exit(1);
  }
}

seedFirestore();
