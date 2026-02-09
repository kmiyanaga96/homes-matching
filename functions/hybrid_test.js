const hybrid = require('./hybrid_scheduler');
const ilp = require('./ilp_scheduler');

function genSample({bands=20, membersPerBandAvg=3, studios=12, days=14, hoursPerDay=10}){
  const slots = [];
  for(let d=0; d<days; d++) for(let h=0; h<hoursPerDay; h++) slots.push(new Date(2026,1,1+d,12+h,0,0).toISOString());
  const studs = [];
  for(let i=0;i<studios;i++) studs.push({ id: `r${i+1}`, name: `Studio${i+1}`, capacity: 2 + Math.floor(Math.random()*10) });
  const bandsArr = [];
  let userIdCounter = 1;
  for(let b=0;b<bands;b++){
    const membersCount = Math.max(1, Math.round(membersPerBandAvg + (Math.random()*2-1)));
    const members = [];
    for(let m=0;m<membersCount;m++){ members.push(`u${userIdCounter++}`); }
    const availableSlots = {};
    for(let si=0;si<slots.length;si++) if (Math.random() < 0.7) availableSlots[si] = true;
    const hours = Math.max(1, Math.floor(membersCount/2));
    bandsArr.push({ id: `b${b+1}`, name:`Band${b+1}`, hours, members, availableSlots });
  }
  return { slots, studios: studs, bands: bandsArr };
}

async function run(){
  const payload = genSample({ bands:20, membersPerBandAvg:3, studios:12, days:14, hoursPerDay:10 });
  payload.slotDurationMinutes = 60;
  payload.maxCandidates = 2;
  payload.travelTimes = {};
  payload.studios.forEach(s => { payload.travelTimes[s.id] = {}; payload.studios.forEach(t=>{ payload.travelTimes[s.id][t.id] = (s.id===t.id?0:60); }); });

  console.log('Running hybrid scheduler...');
  const t0 = Date.now();
  const res = await hybrid.runHybrid(payload);
  const t1 = Date.now();
  console.log('Hybrid done in', (t1-t0)/1000, 's');
  console.log('Assigned groups:', res.assignments.length, 'ILP assigned ranges:', res.ilpResult.length);
}

run().catch(e=>{ console.error(e); process.exit(1); });
