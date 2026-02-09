// Simple in-memory Firestore-like mock for testing runOptimizationForEvent
const functionsIndex = require('./index');
const ilp = require('./ilp_scheduler');

function makeMockFirestore(initialData = {}){
  const store = JSON.parse(JSON.stringify(initialData));

  function ensureCollection(name){ if (!store[name]) store[name] = {}; }

  function collection(name){
    ensureCollection(name);
    return {
      doc: function(id){
        return docRef(name, id);
      },
      where: function(field, op, val){
        // simple where for 'optimizationPending' or eventId
        const docs = Object.keys(store[name]).filter(id => store[name][id] && store[name][id][field] === val).map(id => ({ id, data: () => store[name][id] }));
        return { get: async ()=> ({ docs }) };
      },
      get: async function(){
        const docs = Object.keys(store[name]).map(id => ({ id, data: () => store[name][id], ref: docRef(name,id) }));
        return { empty: docs.length===0, docs };
      }
    };
  }

  function docRef(col, id){
    return {
      id,
      collection: function(sub){
        store[col] = store[col] || {};
        store[col][id] = store[col][id] || {};
        store[col][id][sub] = store[col][id][sub] || {};
        return {
          get: async function(){
            const subdocs = Object.keys(store[col][id][sub]).map(k=>({ id:k, data: ()=> store[col][id][sub][k] }));
            return { empty: subdocs.length===0, docs: subdocs };
          }
        };
      },
      get: async function(){
        const colStore = store[col] || {};
        const d = colStore[id];
        return { exists: !!d, data: ()=> d };
      },
      set: async function(obj){ store[col] = store[col] || {}; store[col][id] = obj; return; },
      update: async function(obj){ store[col] = store[col] || {}; store[col][id] = store[col][id] || {}; Object.assign(store[col][id], obj); return; }
    };
  }

  function batch(){
    const ops = [];
    return {
      set: function(ref, doc){ ops.push({type:'set', ref, doc}); },
      commit: async function(){
        for(const op of ops){
          if (op.type === 'set'){
            // If the ref is a real docRef with a set method, call it
            if (op.ref && typeof op.ref.set === 'function') {
              await op.ref.set(op.doc);
              continue;
            }
            // Otherwise, use the internal _col/_id helpers if present
            const col = op.ref && op.ref._col, id = op.ref && op.ref._id;
            if (col && id) store[col][id] = op.doc;
          }
        }
        return;
      }
    };
  }

  // helpers to build refs for batch (very small shim)
  function makeRef(col, id){ const r = docRef(col,id); r._col = col; r._id = id; return r; }

  // expose helper to create doc refs for batch
  return { collection, _store: store, batch, makeRef };
}

async function run(){
  // build minimal data: one event, studios, studioDistances, bands with availabilities
  const mock = makeMockFirestore({});
  const eventId = 'evt1';
  mock._store.events = {};
  mock._store.events[eventId] = { date: new Date(2026,7,15).toISOString(), windowDays: 14, slotDurationMinutes: 60 };

  // studios
  mock._store.studios = {
    's1': { name: 'Studio1', capacity: 5 },
    's2': { name: 'Studio2', capacity: 4 }
  };

  // studioDistances collection as docs with id 's1__s2' format
  mock._store.studioDistances = { 's1__s2': { minutes: 60 } };

  // bands subcollection under events/evt1/bands
  mock._store.events[eventId].bands = {};
  mock._store.events[eventId].bands['bandA'] = { name: 'Band A', members: ['u1','u2','u3'], requiredHours: 2 };
  mock._store.events[eventId].bands['bandB'] = { name: 'Band B', members: ['u4','u5'], requiredHours: 1 };

  // availabilities as subcollection
  mock._store.events[eventId].bands['bandA'].availabilities = { '0': { available: true }, '1': { available: true } };
  mock._store.events[eventId].bands['bandB'].availabilities = { '1': { available: true }, '2': { available: true } };

  // optimizationRuns and studioSchedules empty
  mock._store.optimizationRuns = {};
  mock._store.studioSchedules = {};

  // Now call runOptimizationForEvent
  const idx = require('./index');
  console.log('Invoking optimization flow with mock DB...');
  await idx.runOptimizationForEvent(eventId, mock, { serverTimestamp: () => new Date().toISOString() });

  console.log('optimizationRuns:', JSON.stringify(mock._store.optimizationRuns, null, 2));
  console.log('studioSchedules:', JSON.stringify(mock._store.studioSchedules, null, 2));
}

run().catch(e=>{ console.error(e); process.exit(1); });
