const ilp = require('./ilp_scheduler');

async function run() {
  // small sample: 3 studios, 4 slots, 3 bands
  const slots = [
    '2026-02-20T18:00:00.000Z',
    '2026-02-20T19:00:00.000Z',
    '2026-02-20T20:00:00.000Z',
    '2026-02-20T21:00:00.000Z'
  ];

  const studios = [
    { id: 'r1', name: 'Studio Small', capacity: 3 },
    { id: 'r2', name: 'Studio Medium', capacity: 5 },
    { id: 'r3', name: 'Studio Large', capacity: 10 }
  ];

  const travelTimes = { r1: { r2: 30, r3: 60 }, r2: { r1: 30, r3: 45 }, r3: { r1: 60, r2: 45 } };

  const bands = [
    { id: 'b1', name: 'Alpha', hours: 2, members: ['u1','u2','u3'], availableSlots: { 0: true, 1: true, 2: true } },
    { id: 'b2', name: 'Beta', hours: 1, members: ['u4','u5','u6','u7'], availableSlots: { 1: true, 2: true, 3: true } },
    { id: 'b3', name: 'Gamma', hours: 1, members: ['u8','u9'], availableSlots: { 0: true, 2: true } }
  ];

  const payload = { slots, slotDurationMinutes: 60, studios, bands, travelTimes, maxCandidates: 2 };
  console.log('Running ILP on sample payload...');
  const res = await ilp.solve(payload);
  console.log('ILP result:', JSON.stringify(res, null, 2));
}

run().catch(e => { console.error(e); process.exit(1); });
