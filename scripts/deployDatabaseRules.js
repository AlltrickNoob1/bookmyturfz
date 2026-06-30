const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function deployDatabaseRules() {
  try {
    console.log('Starting Firebase Database Rules deployment...\n');

    const keyPath = path.join(__dirname, '..', 'seed', 'serviceAccountKey.json');
    if (!fs.existsSync(keyPath)) {
      console.error('❌ Error: serviceAccountKey.json not found at', keyPath);
      process.exit(1);
    }

    const rulesPath = path.join(__dirname, '..', 'database.rules.json');
    if (!fs.existsSync(rulesPath)) {
      console.error('❌ Error: database.rules.json not found at', rulesPath);
      process.exit(1);
    }

    const serviceAccount = require(keyPath);
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const rulesObj = JSON.parse(rulesContent);

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });

    const db = admin.database();
    const projectId = serviceAccount.project_id;

    console.log(`✓ Firebase Admin initialized`);
    console.log(`✓ Project ID: ${projectId}`);
    console.log(`✓ Rules path: ${rulesPath}\n`);

    // Write new default rule to verify access
    console.log('Testing Firebase access...');
    const testRef = db.ref('.info/connected');
    await new Promise((resolve, reject) => {
      testRef.once('value', (snap) => {
        if (snap.val() === true) {
          console.log('✓ Firebase connection verified\n');
          resolve();
        } else {
          reject(new Error('Firebase not connected'));
        }
      }, (error) => {
        reject(error);
      });
    });

    console.log('Current rules being deployed:');
    console.log(JSON.stringify(rulesObj, null, 2));
    console.log('\nNote: Please deploy rules manually via Firebase CLI or Console.'  );
    console.log('Command: firebase deploy --only database -project ' + projectId);
    console.log('\nTo authenticate: firebase login');

    // Clean up
    admin.app().delete();
    console.log('\n✅ Firebase Admin connection tested successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployDatabaseRules();
