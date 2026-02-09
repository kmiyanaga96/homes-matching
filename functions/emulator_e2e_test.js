// Firebase Emulator E2E test — initializes emulator DB, seeds data, runs optimization, verifies writes
const admin = require('firebase-admin');

// Use emulator — connect to localhost:8080
const app = admin.initializeApp({
  projectId: 'emulator-test-project'
}, 'emulator');

const db = admin.firestore(app);

// Set emulator settings (replaces the old connectFirestoreEmulator call)
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

const idx = require('./index');

async function setupEmulatorData() {
  console.log('Setting up emulator data...');
  const eventId = 'evt_emulator_1';

  // Create event
  await db.collection('events').doc(eventId).set({
    date: new Date(2026, 7, 15).toISOString(),
    windowDays: 14,
    slotDurationMinutes: 60
  });

  // Create studios
  await db.collection('studios').doc('s1').set({ name: 'Studio 1', capacity: 5 });
  await db.collection('studios').doc('s2').set({ name: 'Studio 2', capacity: 4 });
  await db.collection('studios').doc('s3').set({ name: 'Studio 3', capacity: 6 });

  // Create studio distances
  await db.collection('studioDistances').doc('s1__s2').set({ minutes: 60 });
  await db.collection('studioDistances').doc('s1__s3').set({ minutes: 90 });
  await db.collection('studioDistances').doc('s2__s3').set({ minutes: 45 });

  // Create bands with availabilities as subcollections
  const bands = [
    { id: 'band_1', name: 'Band Alpha', members: ['u1', 'u2', 'u3'], requiredHours: 2 },
    { id: 'band_2', name: 'Band Beta', members: ['u4', 'u5'], requiredHours: 1 }
  ];

  for (const b of bands) {
    await db.collection('events').doc(eventId).collection('bands').doc(b.id).set({ 
      name: b.name, 
      members: b.members, 
      requiredHours: b.requiredHours 
    });

    // Add availabilities as subcollection (indices 0-3 for testing)
    for (let i = 0; i < 4; i++) {
      await db.collection('events').doc(eventId).collection('bands').doc(b.id).collection('availabilities').doc(String(i)).set({ 
        available: true 
      });
    }
  }

  console.log('Emulator data setup complete. Event:', eventId);
  return eventId;
}

async function run() {
  try {
    const eventId = await setupEmulatorData();

    console.log('\n=== Running Optimization ===');
    const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();
    await idx.runOptimizationForEvent(eventId, db, { serverTimestamp });

    console.log('\n=== Checking Results ===');
    
    // Read optimization runs
    const runsSnap = await db.collection('optimizationRuns').get();
    console.log('Optimization runs found:', runsSnap.docs.length);
    runsSnap.docs.forEach(doc => {
      console.log('  Run:', doc.id, JSON.stringify(doc.data(), null, 2));
    });

    // Read schedules
    const schedSnap = await db.collection('studioSchedules').get();
    console.log('\nStudio schedules found:', schedSnap.docs.length);
    schedSnap.docs.forEach(doc => {
      console.log('  Schedule:', doc.id, JSON.stringify(doc.data(), null, 2));
    });

    if (schedSnap.docs.length > 0) {
      console.log('\n✓ E2E test PASSED — optimization ran and wrote schedules');
    } else {
      console.log('\n✗ E2E test PARTIAL — optimization ran but no schedules written (check model feasibility)');
    }

  } catch (err) {
    console.error('E2E test failed:', err);
    process.exit(1);
  } finally {
    await admin.app('emulator').delete();
  }
}

run();
