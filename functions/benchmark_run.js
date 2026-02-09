const ilp = require('./ilp_scheduler');

function genSample({bands=20, membersPerBandAvg=3, studios=10, days=14, hoursPerDay=10}){
  const slots = [];
  // create slots count = days * hoursPerDay
  for(let d=0; d<days; d++){
    for(let h=0; h<hoursPerDay; h++){
      // simple synthetic ISO
      const ts = new Date(2026,1,1+d, 12+h, 0, 0).toISOString();
      slots.push(ts);
    }
  }

  const studs = [];
  for(let i=0;i<studios;i++) studs.push({ id: `r${i+1}`, name: `Studio${i+1}`, capacity: 2 + Math.floor(Math.random()*10) });

  const bandsArr = [];
  let userIdCounter = 1;
  for(let b=0;b<bands;b++){
    const membersCount = Math.max(1, Math.round(membersPerBandAvg + (Math.random()*2-1)));
    const members = [];
    for(let m=0;m<membersCount;m++){ members.push(`u${userIdCounter++}`); }
    // pick random available slots (70% coverage)
    const availableSlots = {};
    for(let si=0;si<slots.length;si++) if (Math.random() < 0.7) availableSlots[si] = true;
    const hours = Math.max(1, Math.floor(membersCount/2));
    bandsArr.push({ id: `b${b+1}`, name:`Band${b+1}`, hours, members, availableSlots });
  }

  return { slots, studios: studs, bands: bandsArr };
}

async function runBenchmark(){
  const payload = genSample({ bands:20, membersPerBandAvg:3, studios:12, days:14, hoursPerDay:10 });
  payload.slotDurationMinutes = 60;
  payload.maxCandidates = 1; // aggressive pruning for large-scale run (for feasibility test)
    // attach candidateStudios to bands to simulate DB-side prefilter
    payload.bands.forEach(b => { b.candidateStudios = payload.studios.slice(0, payload.maxCandidates).map(s => s.id); });
  // small travelTimes: symmetric full mesh 60 minutes
  payload.travelTimes = {};
  payload.studios.forEach(s => { payload.travelTimes[s.id] = {}; payload.studios.forEach(t => { payload.travelTimes[s.id][t.id] = (s.id===t.id?0:60); }); });

  console.log('Sample sizes: slots=', payload.slots.length, 'studios=', payload.studios.length, 'bands=', payload.bands.length);

  const model = ilp.buildModel(payload);
  const varCount = Object.keys(model.variables || {}).length;
  const consCount = Object.keys(model.constraints || {}).length;
  console.log('Model before solve: variables=', varCount, 'constraints=', consCount);

  const t0 = Date.now();
  const res = await ilp.solve(payload);
  const t1 = Date.now();
  console.log('Solve finished in', (t1-t0)/1000, 's; assignments=', res.length);
}

runBenchmark().catch(e=>{ console.error(e); process.exit(1); });
