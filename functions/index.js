const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ilp = require('./ilp_scheduler');

admin.initializeApp();
const db = admin.firestore();

// Firestore-trigger: events/{eventId}/meta expected to contain `submissionComplete: true` when ready
exports.onEventSubmission = functions.firestore
  .document('events/{eventId}/meta')
  .onUpdate(async (change, context) => {
    const eventId = context.params.eventId;
    const after = change.after.data();
    if (!after || !after.submissionComplete) {
      console.log('submissionComplete flag not set for', eventId);
      return null;
    }

    console.log('Event submission complete, running optimization for', eventId);
    return runOptimizationForEvent(eventId, db, { serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp() });
  });

// Exported helper so tests can invoke optimization flow with a mock `db`.
async function runOptimizationForEvent(eventId, dbInstance, opts = {}) {
  const dbLocal = dbInstance || db;
  const serverTimestamp = (opts && opts.serverTimestamp) ? opts.serverTimestamp : (() => new Date());

  // Start a run record
  const runRef = dbLocal.collection('optimizationRuns').doc();
  const runDoc = { eventId, status: 'started', startedAt: serverTimestamp(), details: {} };
  await runRef.set(runDoc);

  try {
    const eventDoc = await dbLocal.collection('events').doc(eventId).get();
    const event = eventDoc.exists ? eventDoc.data() : {};

      // Fetch studios collection
      const studiosSnap = await dbLocal.collection('studios').get();
      const studios = studiosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch studio travel times if available (collection: studioDistances)
      const travelTimes = {};
      try {
        const distSnap = await dbLocal.collection('studioDistances').get();
        distSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d && d.from && d.to && d.minutes != null) {
            travelTimes[d.from] = travelTimes[d.from] || {};
            travelTimes[d.from][d.to] = d.minutes;
          } else if (doc.id && d && d.minutes != null && doc.id.includes('__')) {
            const parts = doc.id.split('__');
            const a = parts[0], b = parts[1];
            travelTimes[a] = travelTimes[a] || {};
            travelTimes[a][b] = d.minutes;
            travelTimes[b] = travelTimes[b] || {};
            travelTimes[b][a] = d.minutes;
          }
        });
      } catch (e) {
        console.log('No studioDistances collection or parse error, falling back to defaults');
      }

      // Fetch bands and availabilities. Support several common schema patterns:
      // 1) events/{eventId}/bands (subcollection)
      // 2) collectionGroup('bands') with field eventId
      // 3) root collection 'bands' with field eventId
      let bands = [];
      const eventBandsRef = dbLocal.collection('events').doc(eventId).collection('bands');
      const bandsSnap = await eventBandsRef.get();
      if (!bandsSnap.empty) {
        bands = bandsSnap.docs.map(d => ({ ref: d.ref, id: d.id, data: d.data() }));
      } else {
        // try collectionGroup
        const cg = await dbLocal.collectionGroup('bands').where('eventId', '==', eventId).get();
        if (!cg.empty) {
          bands = cg.docs.map(d => ({ ref: d.ref, id: d.id, data: d.data() }));
        } else {
          // fallback to root bands collection with eventId field
          const rootBands = await dbLocal.collection('bands').where('eventId', '==', eventId).get();
          bands = rootBands.docs.map(d => ({ ref: d.ref, id: d.id, data: d.data() }));
        }
      }

      // Helper: read availabilities for a band doc in flexible ways
      async function readAvailabilitiesForBand(bandDoc) {
        const availableSlots = {};
        const bdata = bandDoc.data || {};

        // Case A: band document contains an 'availabilities' map field: { "12:00": true }
        if (bdata.availabilities && typeof bdata.availabilities === 'object') {
          Object.keys(bdata.availabilities).forEach(k => { if (bdata.availabilities[k]) availableSlots[k] = true; });
        }

        // Case B: band has subcollection 'availabilities'
        try {
          if (bandDoc.ref && bandDoc.ref.collection) {
            const availCol = await bandDoc.ref.collection('availabilities').get();
            if (!availCol.empty) {
              availCol.docs.forEach(ad => {
                const d = ad.data();
                // support doc.id keyed by slotIndex or timestamp, or field 'slot'
                const key = (d && d.slot) ? d.slot : ad.id;
                if (d && typeof d.available !== 'undefined') {
                  if (d.available) availableSlots[key] = true;
                } else {
                  // assume presence means available
                  availableSlots[key] = true;
                }
              });
            }
          }
        } catch (e) {
          console.log('Failed to read band availabilities subcollection for', bandDoc.id, e.message || e);
        }

        // Case C: event-level availabilities collection (events/{eventId}/availabilities/{bandId})
        try {
          const eventAvailRef = dbLocal.collection('events').doc(eventId).collection('availabilities').doc(bandDoc.id);
          const evdoc = await eventAvailRef.get();
          if (evdoc.exists) {
            const d = evdoc.data();
            if (d && d.slots && typeof d.slots === 'object') {
              Object.keys(d.slots).forEach(k => { if (d.slots[k]) availableSlots[k] = true; });
            }
          }
        } catch (e) {
          // ignore if not present
        }

        return availableSlots;
      }

      // Build normalized bands array for ILP
      const normalizedBands = [];
      for (const bd of bands) {
        const bdoc = bd;
        const b = bdoc.data || {};
        const availableSlots = await readAvailabilitiesForBand(bdoc);
        normalizedBands.push({ id: bdoc.id, name: b.name || b.bandName || '', hours: b.requiredHours || b.hours || 0, members: b.members || [], availableSlots });
      }

      // Build slot list: prefer explicit event.slots (array of ISO strings); otherwise generate a window
      let slots = event.slots && Array.isArray(event.slots) ? event.slots.slice() : null;
      if (!slots) {
        // Try event.startDate / event.date and window length
        const eventDate = event.date || event.eventDate || event.startDate;
        const windowDays = event.windowDays || 14;
        const slotDuration = event.slotDurationMinutes || 60;
        if (eventDate) {
          const ev = new Date(eventDate);
          const slotsArr = [];
          for (let d = windowDays; d >= 1; d--) {
            const day = new Date(ev);
            day.setDate(ev.getDate() - d);
            // hours 12..22 inclusive as possible starts
            for (let h = 12; h <= 22; h++) {
              const s = new Date(day);
              s.setHours(h, 0, 0, 0);
              slotsArr.push(s.toISOString());
            }
          }
          slots = slotsArr;
        } else {
          slots = [];
        }
      }

      // Normalize availableSlots keys: convert timestamp keys to slot indices when possible
      // Build a mapping timestamp->index
      const slotIndexByTimestamp = {};
      slots.forEach((ts, idx) => { slotIndexByTimestamp[ts] = idx; });

      const bandsForIlp = normalizedBands.map(b => {
        const available = {};
        Object.keys(b.availableSlots || {}).forEach(k => {
          // if key is numeric string, keep as index
          if (!isNaN(parseInt(k, 10)) && slotIndexByTimestamp[slots[parseInt(k,10)]]) {
            available[parseInt(k,10)] = true;
          } else if (slotIndexByTimestamp[k] != null) {
            available[slotIndexByTimestamp[k]] = true;
          } else if (!isNaN(parseInt(k,10))) {
            // direct numeric index
            available[parseInt(k,10)] = true;
          }
        });
        return { id: b.id, name: b.name, hours: b.hours, members: b.members, availableSlots: available };
      });

      // DB-side prefilter: compute candidate studios per band and attach to band objects to reduce ILP size.
      const MAX_CAND = 3; // default per-band studio candidates
      const studiosById = Object.fromEntries(studios.map(s => [s.id, s]));
      bandsForIlp.forEach(b => {
        const mcount = (b.members || []).length || 0;
        // prefer studios with capacity >= mcount and minimal slack
        const good = studios.map(s => {
          const cap = s.capacity || (s.tatami ? Math.floor(s.tatami * 2) : null) || 9999;
          return { id: s.id, cap, slack: Math.abs(cap - mcount), fits: cap >= mcount };
        }).filter(x => x.fits).sort((a,b2)=>a.slack - b2.slack).slice(0, MAX_CAND).map(x=>x.id);
        if (good.length > 0) b.candidateStudios = good;
        else b.candidateStudios = studios.slice(0, Math.min(MAX_CAND, studios.length)).map(s=>s.id);
      });

      const payload = { slots, studios, bands: bandsForIlp, travelTimes, slotDurationMinutes: event.slotDurationMinutes || 60 };

      // try to build model for diagnostics (catch OOM or large models)
      let modelInfo = { variables: 0, constraints: 0 };
      try {
        const model = ilp.buildModel(payload);
        modelInfo.variables = Object.keys(model.variables || {}).length;
        modelInfo.constraints = Object.keys(model.constraints || {}).length;
      } catch (mErr) {
        console.error('Failed to build ILP model for diagnostics:', mErr);
        modelInfo.error = (mErr && mErr.message) ? mErr.message : String(mErr);
      }

      // update run doc with model info
      await runRef.update({ 'details.modelInfo': modelInfo });

      // Solve ILP with timing
      const t0 = Date.now();
      let ilpResult = [];
      try {
        ilpResult = await ilp.solve(payload);
      } catch (solveErr) {
        console.error('ILP solve failed for', eventId, solveErr);
        await runRef.update({ status: 'failed', error: (solveErr && solveErr.message) ? solveErr.message : String(solveErr), finishedAt: serverTimestamp() });
        return null;
      }
      const t1 = Date.now();

      // Map ILP output indices back to slot timestamps when possible and write schedules
      const batch = dbLocal.batch();
      ilpResult.forEach(r => {
        const docRef = dbLocal.collection('studioSchedules').doc();
        const doc = { eventId, bandId: r.bandId, studioId: r.studioId, startIndex: r.startIndex, endIndex: r.endIndex, autoOptimized: true, createdAt: serverTimestamp() };
        batch.set(docRef, doc);
      });
      if (ilpResult.length > 0) await batch.commit();

      // finalize run doc
      await runRef.update({ status: 'success', assignments: ilpResult.length, timingSec: (t1 - t0) / 1000, finishedAt: serverTimestamp() });
      console.log('Optimization finished for', eventId, 'assignments:', ilpResult.length, 'time(s):', (t1 - t0) / 1000);
    } catch (e) {
      console.error('Optimization failed for', eventId, e);
      await runRef.update({ status: 'error', error: (e && e.message) ? e.message : String(e), finishedAt: serverTimestamp() });
    }

  return null;
}

exports.runOptimizationForEvent = runOptimizationForEvent;

// Scheduled run (Cloud Scheduler via pubsub) - runs daily to catch missed jobs / re-optimize
exports.scheduledOptimization = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Scheduled optimization run start');
    // Example: query events with `optimizationPending == true` and trigger per-event optimization
    const q = await db.collection('events').where('optimizationPending', '==', true).get();
    for (const doc of q.docs) {
      // set flag to trigger the onEventSubmission flow, or call ILP directly here
      console.log('Would optimize event:', doc.id);
    }
    console.log('Scheduled optimization run finished');
    return null;
  });
