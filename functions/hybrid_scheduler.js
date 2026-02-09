const ilp = require('./ilp_scheduler');

// Greedy allocator: assign as many slots as possible per band using candidate studios
function greedyAllocate({slots, studios, bands, travelTimes = {}, slotDurationMinutes = 60, maxCandidates = 3}){
  const slotsCount = slots.length;
  const studiosById = Object.fromEntries(studios.map(s=>[s.id, s]));

  // compute per-band candidate studios (prefer capacity fit)
  const perBandCandidates = {};
  bands.forEach(b=>{
    const mcount = (b.members||[]).length || 0;
    const usable = [], undersized = [];
    studios.forEach(st=>{
      const cap = st.capacity || (st.tatami?Math.floor(st.tatami*2):null) || 9999;
      if (cap >= mcount) usable.push({id:st.id, slack:Math.abs(cap-mcount)});
      else undersized.push({id:st.id, slack:Math.abs(cap-mcount)+10000});
    });
    usable.sort((a,b2)=>a.slack-b2.slack);
    undersized.sort((a,b2)=>a.slack-b2.slack);
    const pick = usable.slice(0,maxCandidates).map(x=>x.id);
    if (pick.length < maxCandidates) pick.push(...undersized.slice(0, maxCandidates-pick.length).map(x=>x.id));
    perBandCandidates[b.id] = pick;
  });

  // active slots
  const activeSlots = [];
  bands.forEach(b=> Object.keys(b.availableSlots||{}).forEach(k=>{ const i=parseInt(k,10); if(!isNaN(i)) activeSlots.push(i);}));
  const uniqActive = Array.from(new Set(activeSlots)).sort((a,b)=>a-b);

  const studioBooked = {}; studios.forEach(s=> studioBooked[s.id] = {});
  const memberBooked = {}; // member -> array of {ti, studioId}

  const assignments = []; // {bandId, studioId, slotIndex}

  // travel helper
  function travelSlots(a,b){
    const minutes = (travelTimes && travelTimes[a] && travelTimes[a][b]) || (a===b?0:60);
    return Math.max(0, Math.ceil(minutes/slotDurationMinutes));
  }

  // sort bands by descending hours (more constrained first)
  const bandOrder = bands.slice().sort((a,b)=> (b.hours||0) - (a.hours||0));

  bandOrder.forEach(b=>{
    let remaining = b.hours || 0;
    const candidates = b.candidateStudios || perBandCandidates[b.id] || studios.map(s=>s.id);
    // try to allocate greedily preferring contiguous by scanning slots in order
    for (const ti of uniqActive) {
      if (remaining <= 0) break;
      if (!b.availableSlots[ti] && !b.availableSlots[slots[ti]]) continue;
      // try each candidate studio
      let allocated = false;
      for (const sid of candidates) {
        if (studioBooked[sid][ti]) continue; // room occupied
        // check member travel/conflict
        let ok = true;
        for (const m of (b.members||[])){
          const bookings = memberBooked[m] || [];
          for (const bk of bookings){
            if (bk.ti === ti) { ok = false; break; }
            const dt = Math.abs(bk.ti - ti);
            const needed = travelSlots(bk.studioId, sid);
            if (bk.studioId !== sid && dt < needed) { ok = false; break; }
          }
          if (!ok) break;
        }
        if (!ok) continue;
        // allocate one slot
        studioBooked[sid][ti] = true;
        (b.members||[]).forEach(m=>{ memberBooked[m] = memberBooked[m] || []; memberBooked[m].push({ti, studioId: sid}); });
        assignments.push({ bandId: b.id, studioId: sid, slotIndex: ti });
        remaining -= 1;
        allocated = true;
        break;
      }
      if (remaining <= 0) break;
    }
  });

  // group assignments per band into assignedBands and compute unscheduled remaining
  const assignedMap = {};
  assignments.forEach(a=>{ assignedMap[a.bandId] = assignedMap[a.bandId] || []; assignedMap[a.bandId].push(a.slotIndex); });
  const greedyResult = [];
  const unscheduledBands = [];
  bands.forEach(b=>{
    const assigned = assignedMap[b.id]||[];
    if (assigned.length === 0) unscheduledBands.push(b);
    else {
      // merge into ranges and pick studio from first assignment for now
      assigned.sort((x,y)=>x-y);
      const ranges = [];
      let start = assigned[0], prev = assigned[0];
      for (let i=1;i<assigned.length;i++){
        const cur = assigned[i]; if (cur === prev+1) { prev = cur; continue; } ranges.push({start, end: prev}); start = cur; prev = cur;
      }
      ranges.push({start, end: prev});
      greedyResult.push({ bandId: b.id, studioId: assignments.find(a=>a.bandId===b.id).studioId, ranges, assignedCount: assigned.length, members: b.members });
      if (assigned.length < (b.hours||0)) unscheduledBands.push(Object.assign({}, b, { hours: (b.hours||0) - assigned.length }));
    }
  });

  return { greedyResult, unscheduledBands, assignments };
}

async function runHybrid(payload){
  const { slots, studios, bands, travelTimes, slotDurationMinutes } = payload;
  // run greedy
  const greedy = greedyAllocate(payload);

  // prepare ILP payload for unscheduled bands only
  const remaining = greedy.unscheduledBands;
  if (!remaining || remaining.length === 0) {
    return { assignments: greedy.greedyResult, ilpResult: [], unscheduled: [] };
  }

  const ilpPayload = { slots, studios, bands: remaining.map(b=>({ id:b.id, name:b.name, hours:b.hours, members:b.members, availableSlots: b.availableSlots||{} })), travelTimes, slotDurationMinutes, maxCandidates: payload.maxCandidates || 3 };
  const ilpRes = await ilp.solve(ilpPayload);

  // combine results (convert ilpRes ranges to similar structure)
  const combined = greedy.greedyResult.slice();
  ilpRes.forEach(r=>{
    combined.push({ bandId: r.bandId, studioId: r.studioId, ranges: [{ start: r.startIndex, end: r.endIndex }], assignedCount: (r.endIndex - r.startIndex + 1) });
  });

  const unscheduled = []; // bands still not fulfilled (could compute if needed)
  return { assignments: combined, ilpResult: ilpRes, unscheduled };
}

module.exports = { runHybrid, greedyAllocate };
