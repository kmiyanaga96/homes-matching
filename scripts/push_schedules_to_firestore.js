/*
Batch-push schedules_output.json to Firestore using Firebase Admin SDK.

Usage:
1. Install dependency in project root:
   npm install firebase-admin

2. Provide service account JSON (Google Cloud) via environment variable:
   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
   (on PowerShell use $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\...')

3. Run:
   node scripts/push_schedules_to_firestore.js [path/to/schedules_output.json]

Notes:
- Writes to collection `studioSchedules`.
- This script performs a batched commit (500 writes per batch limit handled).
*/

const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');

// Init firebase-admin (uses GOOGLE_APPLICATION_CREDENTIALS or ADC)
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && process.argv.length < 3) {
  console.error('Require GOOGLE_APPLICATION_CREDENTIALS to be set to service account JSON path.');
  process.exit(1);
}

try {
  admin.initializeApp();
} catch (e) {
  // if already initialized in same process
}

const db = admin.firestore();

const inputPath = process.argv[2] || path.join(__dirname, 'schedules_output.json');
if (!fs.existsSync(inputPath)) {
  console.error('Input file not found:', inputPath);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const schedules = payload.schedules || [];

if (schedules.length === 0) {
  console.log('No schedules to push.');
  process.exit(0);
}

(async () => {
  try {
    let batch = db.batch();
    let counter = 0;
    for (const s of schedules) {
      const docRef = db.collection('studioSchedules').doc();
      const doc = {
        bandId: s.bandId,
        bandName: s.bandName,
        date: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        studioRoomId: s.studioId,
        studioName: s.studioName,
        hours: s.hours,
        members: s.members,
        autoOptimized: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(docRef, doc);
      counter++;

      // commit per 400 writes to be safe
      if (counter % 400 === 0) {
        await batch.commit();
        console.log(`Committed ${counter} writes so far...`);
        batch = db.batch();
      }
    }
    if (counter % 400 !== 0) {
      await batch.commit();
    }
    console.log(`Pushed ${counter} schedules to Firestore (collection: studioSchedules).`);
  } catch (e) {
    console.error('Error pushing schedules:', e);
    process.exit(1);
  }
})();
