Seed scripts
============

Place your service account JSON key at `seed/serviceAccountKey.json` (do NOT commit it).

Install admin SDK first:

```powershell
npm install firebase-admin
```

Run Firestore seed:

```powershell
node seed/firestoreSeed.js
```

Run Realtime DB seed:

```powershell
node seed/realtimeSeed.js
```

If you prefer to import JSON directly to Realtime Database, use `seed/sampleRealtime.json` with Firebase Console or CLI.
