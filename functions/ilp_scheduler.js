const solver = require('javascript-lp-solver');

/**
 * Enhanced ILP scheduler with:
 * - travel-time constraints (pairwise studio travel minutes -> slot window)
 * - adjacency variables linearization to favor contiguous blocks
 *
 * Input `data` shape (expected):
 * {
 *   slots: [ '2026-08-10T12:00', ... ], // discrete 1-hour slot identifiers
 *   slotDurationMinutes: 60, // default 60
 *   studios: [{ id: 'r1', name: 'NOAH S' }, ...],
 *   travelTimes: { fromId: { toId: minutes, ... }, ... }  // optional
 *   bands: [{ id:'b1', name:'Band A', hours:2, members:['u1','u2'], availableSlots: { slotIndex: true, ... } }, ...]
 * }
 *
 * Returns array of assignments: { bandId, studioId, startIndex, endIndex }
 */

function buildModel(data) {
  const model = { optimize: 'obj', opType: 'max', constraints: {}, variables: {}, ints: {} };
  const { slots, slotDurationMinutes = 60, studios, bands, travelTimes = {}, maxCandidates = 4 } = data;
  if (!Array.isArray(slots) || !studios || !bands) throw new Error('Invalid data for ILP scheduler');

  function ensureConstraint(key, type, value) {
    if (!model.constraints[key]) model.constraints[key] = {};
    // If same type already exists, keep the tighter bound for safety
    if (type === 'max') model.constraints[key].max = Math.min(model.constraints[key].max ?? Infinity, value);
    else if (type === 'min') model.constraints[key].min = Math.max(model.constraints[key].min ?? -Infinity, value);
    else model.constraints[key][type] = value;
  }

  // Per-band required hours (min)
  bands.forEach(b => {
    ensureConstraint(`band_${b.id}`, 'min', b.hours || 0);
  });

  // Determine active slots (slots with at least one band's availability) to reduce model size
  const activeSlotIndices = new Set();
  bands.forEach(b => Object.keys(b.availableSlots || {}).forEach(k => { const idx = parseInt(k,10); if (!isNaN(idx)) activeSlotIndices.add(idx); }));
  const activeSlots = Array.from(activeSlotIndices).sort((a,b2)=>a-b2);

  // determine union of candidate studios across bands (if provided) to reduce model size
  const studioIdSet = new Set();
  bands.forEach(b => {
    if (b.candidateStudios && Array.isArray(b.candidateStudios)) b.candidateStudios.forEach(sid=>studioIdSet.add(sid));
  });
  // fallback to all studios if none provided
  const usedStudios = studioIdSet.size > 0 ? studios.filter(s=>studioIdSet.has(s.id)) : studios;

  // Per used studio-slot capacity <=1 (only active slots)
  activeSlots.forEach(ti => {
    usedStudios.forEach(st => ensureConstraint(`room_${st.id}_t${ti}`, 'max', 1));
  });

  // Per band-time at most one room (only active slots)
  bands.forEach(b => activeSlots.forEach(ti => ensureConstraint(`band_time_${b.id}_t${ti}`, 'max', 1)));

  // Per member-time at most one assignment (we will further add travel-time constraints)
  const members = {};
  bands.forEach(b => (b.members || []).forEach(m => (members[m] = true)));
  Object.keys(members).forEach(m => activeSlots.forEach(ti => ensureConstraint(`member_time_${m}_t${ti}`, 'max', 1)));

  // Pre-filter: choose up to `maxCandidates` studios per band to reduce ILP size.
  // Scoring: prefer studios whose capacity fits the band members with minimal slack.
  const perBandCandidates = {};
  bands.forEach(b => {
    const mcount = (b.members || []).length || 0;
    // prefer studios that can accommodate the band; exclude undersized studios when possible
    const usable = [];
    const undersized = [];
    studios.forEach(st => {
      const cap = st.capacity || (st.tatami ? Math.floor(st.tatami * 2) : null) || 9999;
      const slack = Math.abs(cap - mcount);
      if (cap >= mcount) usable.push({ id: st.id, slack, cap });
      else undersized.push({ id: st.id, slack: slack + 10000, cap });
    });
    usable.sort((a,b2)=>a.slack-b2.slack);
    undersized.sort((a,b2)=>a.slack-b2.slack);
    const picked = usable.slice(0, maxCandidates).map(s=>s.id);
    if (picked.length < maxCandidates) {
      const need = maxCandidates - picked.length;
      picked.push(...undersized.slice(0, need).map(s=>s.id));
    }
    perBandCandidates[b.id] = picked;
  });

  // We will produce variables for (band,slot,studio) when band is available at that slot
  // Keep lookups to build travel constraints and adjacency variables later
  const varLookup = {}; // key: `${b.id}|${ti}|${st.id}` -> varName
  const memberVarByTimeAndStudio = {}; // member -> ti -> studioId -> [varNames]

  // Create slot vars with high weight (prioritize meeting band hours)
  const SLOT_OBJ_WEIGHT = 1000;
  const ADJ_OBJ_WEIGHT = 1; // small bonus for contiguous pair

  bands.forEach(b => {
    const bandAvailable = b.availableSlots || {};
    // iterate only active slots
    activeSlots.forEach(ti => {
      const s = slots[ti];
      const isAvailable = bandAvailable[ti] || bandAvailable[s] || false;
      if (!isAvailable) return;
      // Only iterate candidate studios for this band. If caller provided `b.candidateStudios`, prefer that.
      const candidateStudioIds = b.candidateStudios || perBandCandidates[b.id] || usedStudios.map(s=>s.id);
      usedStudios.forEach(st => {
        if (!candidateStudioIds.includes(st.id)) return;
        const vname = `v_b${b.id}_t${ti}_r${st.id}`;
        const v = { obj: SLOT_OBJ_WEIGHT };

        // band hours
        v[`band_${b.id}`] = 1;
        // room-time
        v[`room_${st.id}_t${ti}`] = 1;
        // band-time
        v[`band_time_${b.id}_t${ti}`] = 1;
        // member-time
        (b.members || []).forEach(m => { v[`member_time_${m}_t${ti}`] = 1; });

        model.variables[vname] = v;
        model.ints[vname] = 1;

        varLookup[`${b.id}|${ti}|${st.id}`] = vname;
        (b.members || []).forEach(m => {
          memberVarByTimeAndStudio[m] = memberVarByTimeAndStudio[m] || {};
          memberVarByTimeAndStudio[m][ti] = memberVarByTimeAndStudio[m][ti] || {};
          memberVarByTimeAndStudio[m][ti][st.id] = memberVarByTimeAndStudio[m][ti][st.id] || [];
          memberVarByTimeAndStudio[m][ti][st.id].push(vname);
        });
      });
    });
  });

  // Travel-time constraints: for each member, for each pair of times within travelSlots window,
  // prohibit assignments that would require travel between different studios within that window.
  const slotsCount = slots.length;
  // Compute travelSlots per pair (rounded up)
  function getTravelSlots(a, b) {
    const minutes = (travelTimes && travelTimes[a] && travelTimes[a][b]) || (a === b ? 0 : 60);
    return Math.max(0, Math.ceil(minutes / slotDurationMinutes));
  }

  Object.keys(memberVarByTimeAndStudio).forEach(m => {
    for (let ti = 0; ti < slotsCount; ti++) {
      for (let tj = Math.max(0, ti - 5); tj <= Math.min(slotsCount - 1, ti + 5); tj++) {
        if (ti === tj) continue;
        const dt = Math.abs(ti - tj);
        // For each pair of studios where travelSlots > dt, add constraint
        // iterate studios present at these time indices for this member
        const studiosAtTi = Object.keys((memberVarByTimeAndStudio[m] && memberVarByTimeAndStudio[m][ti]) || {});
        const studiosAtTj = Object.keys((memberVarByTimeAndStudio[m] && memberVarByTimeAndStudio[m][tj]) || {});
        studiosAtTi.forEach(s1 => {
          studiosAtTj.forEach(s2 => {
            if (s1 === s2) return; // same studio, no travel needed
            const travelSlots = getTravelSlots(s1, s2);
            if (travelSlots <= dt) return; // enough gap
            // create constraint that sum(vars at (ti,s1) + vars at (tj,s2)) <= 1
            const ckey = `member_travel_${m}_t${ti}_t${tj}_r${s1}_r${s2}`;
            ensureConstraint(ckey, 'max', 1);
            const arr1 = memberVarByTimeAndStudio[m][ti][s1] || [];
            const arr2 = memberVarByTimeAndStudio[m][tj][s2] || [];
            arr1.forEach(vn => { model.variables[vn][ckey] = (model.variables[vn][ckey] || 0) + 1; });
            arr2.forEach(vn => { model.variables[vn][ckey] = (model.variables[vn][ckey] || 0) + 1; });
          });
        });
      }
    }
  });

  // Adjacency (contiguity) linearization: for each band, adjacent slot pair in same studio create y variable
  Object.keys(varLookup).forEach(k => {});
  bands.forEach(b => {
    for (let ti = 0; ti < slotsCount - 1; ti++) {
      studios.forEach(st => {
        const v1 = varLookup[`${b.id}|${ti}|${st.id}`];
        const v2 = varLookup[`${b.id}|${ti + 1}|${st.id}`];
        if (!v1 || !v2) return;
        const yname = `y_b${b.id}_t${ti}_r${st.id}`;
        // y binary var
        model.variables[yname] = { obj: ADJ_OBJ_WEIGHT };
        model.ints[yname] = 1;

        // y - v1 <= 0  -> y - v1 <= 0
        ensureConstraint(`c_y_le_v1_${yname}`, 'max', 0);
        model.variables[yname][`c_y_le_v1_${yname}`] = (model.variables[yname][`c_y_le_v1_${yname}`] || 0) + 1;
        model.variables[v1][`c_y_le_v1_${yname}`] = (model.variables[v1][`c_y_le_v1_${yname}`] || 0) - 1;

        // y - v2 <= 0
        ensureConstraint(`c_y_le_v2_${yname}`, 'max', 0);
        model.variables[yname][`c_y_le_v2_${yname}`] = (model.variables[yname][`c_y_le_v2_${yname}`] || 0) + 1;
        model.variables[v2][`c_y_le_v2_${yname}`] = (model.variables[v2][`c_y_le_v2_${yname}`] || 0) - 1;

        // y - v1 - v2 >= -1  -> set min = -1
        ensureConstraint(`c_y_ge_v1v2_${yname}`, 'min', -1);
        model.variables[yname][`c_y_ge_v1v2_${yname}`] = (model.variables[yname][`c_y_ge_v1v2_${yname}`] || 0) + 1;
        model.variables[v1][`c_y_ge_v1v2_${yname}`] = (model.variables[v1][`c_y_ge_v1v2_${yname}`] || 0) - 1;
        model.variables[v2][`c_y_ge_v1v2_${yname}`] = (model.variables[v2][`c_y_ge_v1v2_${yname}`] || 0) - 1;
      });
    }
  });

  return model;
}

async function solve(data) {
  const model = buildModel(data);
  const results = solver.Solve(model);
  if (!results || !results.feasible) return [];

  // Collect assigned slot variables
  const assignments = [];
  Object.keys(results).forEach(k => {
    if (!k.startsWith('v_b')) return;
    if (results[k] === 1) {
      const m = k.match(/^v_b(.+)_t(\d+)_r(.+)$/);
      if (m) {
        const bandId = m[1];
        const ti = parseInt(m[2], 10);
        const roomId = m[3];
        assignments.push({ bandId, slotIndex: ti, studioId: roomId });
      }
    }
  });

  // Merge contiguous indices per band+studio
  const byBand = {};
  assignments.forEach(a => {
    const key = `${a.bandId}__${a.studioId}`;
    byBand[key] = byBand[key] || [];
    byBand[key].push(a.slotIndex);
  });

  const output = [];
  Object.keys(byBand).forEach(k => {
    const [bandId, studioId] = k.split('__');
    const indices = byBand[k].sort((x, y) => x - y);
    let start = indices[0], prev = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const cur = indices[i];
      if (cur === prev + 1) { prev = cur; continue; }
      output.push({ bandId, studioId, startIndex: start, endIndex: prev });
      start = cur; prev = cur;
    }
    output.push({ bandId, studioId, startIndex: start, endIndex: prev });
  });

  return output;
}

module.exports = { solve, buildModel };
