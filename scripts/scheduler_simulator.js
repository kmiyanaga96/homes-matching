const fs = require('fs');
const path = require('path');

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function generateSlots() {
  // starts from 12:00 to 22:00 inclusive, step 30 minutes
  const slots = [];
  for (let h = 12; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h !== 22) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function coversInterval(avails, slotStartMin, slotEndMin) {
  // avails: array of [start,end] strings
  return avails.some(([s, e]) => {
    const sm = timeToMinutes(s);
    const em = timeToMinutes(e);
    return sm <= slotStartMin && em >= slotEndMin;
  });
}

function bandAvailableForSlot(band, members, day, slotStartMin, slotEndMin) {
  return band.members.every(uid => {
    const member = members[uid];
    const av = member.availabilities[day] || [];
    return coversInterval(av, slotStartMin, slotEndMin);
  });
}

function runScheduler(data, studios) {
  const slots = generateSlots();
  const slotMinutes = slots.map(s => timeToMinutes(s));

  const studioList = studios.map(s => ({...s}));
  const travelMinutes = 60; // per `studioData.md`, all studio-to-studio travel time is 1 hour

  // Copy bands and remaining hours
  const bands = data.bands.map(b => ({...b, remaining: b.requiredHours}));

  // Preliminary: cancel bands if any member missing availability
  const validBands = bands.filter(b => {
    for (const m of b.members) {
      const mem = data.members[m];
      if (!mem) return false;
      const hasAny = data.days.some(d => (mem.availabilities[d] || []).length > 0);
      if (!hasAny) return false;
    }
    return true;
  });

  // Build slotAvailable[bandId][day][slotIndex]
  const slotAvailable = {};
  for (const b of validBands) {
    slotAvailable[b.id] = {};
    for (const day of data.days) {
      slotAvailable[b.id][day] = slots.map((slot, idx) => {
        const startMin = slotMinutes[idx];
        const endMin = startMin + 60; // 1 hour slot
        return bandAvailableForSlot(b, data.members, day, startMin, endMin);
      });
    }
  }

  // dayScore
  const dayScore = {};
  for (const day of data.days) {
    let score = 0;
    for (const b of validBands) {
      score += slotAvailable[b.id][day].filter(Boolean).length;
    }
    dayScore[day] = score;
  }

  const sortedDays = [...data.days].sort((a,b) => dayScore[b] - dayScore[a]);

  // booking maps
  const studioBooked = {}; // studioBooked[studioId][day][slotIndex] = true
  for (const s of studioList) {
    studioBooked[s.id] = {};
    for (const day of data.days) {
      studioBooked[s.id][day] = [];
    }
  }
  const memberBooked = {}; // memberBooked[uid][day] = [{idx, studioId}, ...]
  for (const uid of Object.keys(data.members)) memberBooked[uid] = {};

  const schedules = [];

  // main loop
  for (const day of sortedDays) {
    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      // choose bands with remaining >0 sorted by remaining desc
      const candidates = validBands.filter(b => b.remaining > 0);
      candidates.sort((a,b) => b.remaining - a.remaining);

      for (const band of candidates) {
        // slot must be available for band
        if (!slotAvailable[band.id][day][slotIdx]) continue;
        
        const startMin = slotMinutes[slotIdx];
        
        // find studios that can host (prefer smallest fitting, but try multiple)
        const minTatami = Math.ceil(band.members.length * 2);
        const candidates_list = studioList.filter(s => s.tatami >= minTatami);
        candidates_list.sort((a,b) => a.tatami - b.tatami);
        
        let studio = null;
        let validAllocationLen = 0;
        let allocIndices = [];
        
        // try each studio candidate
        for (const candidate of candidates_list) {
          studio = candidate;
          validAllocationLen = 0; // reset for each studio candidate
          allocIndices = []; // reset for each studio candidate
          
          // Pre-compute all required slot indices for potential consecutive allocation
          const candidateIndices = [slotIdx];
          for (let k = 1; k < band.remaining; k++) {
            const targetStartMin = startMin + k * 60;
            const nextIdx = slotMinutes.indexOf(targetStartMin);
            if (nextIdx === -1) break;
            candidateIndices.push(nextIdx);
          }

          // Validate entire allocation for this studio
          let maxValidLen = 1;
          for (let len = 1; len <= candidateIndices.length; len++) {
            const indices = candidateIndices.slice(0, len);
            let isValid = true;

            for (const idx of indices) {
              if (!slotAvailable[band.id][day][idx]) {
                isValid = false;
                break;
              }
              if (!studioBooked[studio.id][day]) studioBooked[studio.id][day] = [];
              // Check both slots for this 1-hour block
              if (studioBooked[studio.id][day][idx] || (idx + 1 < slots.length && studioBooked[studio.id][day][idx + 1])) {
                isValid = false;
                break;
              }
              const slotStart = slotMinutes[idx];
              const slotEnd = slotStart + 60;
              const memberConflict = band.members.some(uid => {
                const bookings = memberBooked[uid][day] || [];
                for (const b of bookings) {
                  const existingStart = slotMinutes[b.idx];
                  const existingEnd = existingStart + 60;
                  if (slotStart < existingEnd && existingStart < slotEnd) return true;
                  if (b.studioId !== studio.id) {
                    if (existingEnd <= slotStart && (slotStart - existingEnd) < travelMinutes) return true;
                    if (slotEnd <= existingStart && (existingStart - slotEnd) < travelMinutes) return true;
                  }
                }
                return false;
              });
              if (memberConflict) {
                isValid = false;
                break;
              }
            }

            if (isValid) {
              maxValidLen = len;
            } else {
              break;
            }
          }

          if (maxValidLen > 0) {
            // Tentative allocation time range
            const tentativeIndices = candidateIndices.slice(0, maxValidLen);
            const tFirst = slotMinutes[tentativeIndices[0]];
            const tLast = slotMinutes[tentativeIndices[tentativeIndices.length - 1]] + 60;
            // Check against already accepted schedules to avoid overlaps as a safety net
            const overlapWithExisting = schedules.some(s => s.day === day && s.studioId === candidate.id && (tFirst < timeToMinutes(s.endTime) && timeToMinutes(s.startTime) < tLast));
            if (overlapWithExisting) {
              // try next candidate studio
              continue;
            }

            validAllocationLen = maxValidLen;
            allocIndices = tentativeIndices;
            studio = candidate;
            break; // found valid allocation with this studio
          }
        }
        
        if (validAllocationLen === 0) continue;

        // allocate
        const firstIdx = allocIndices[0];
        const lastIdx = allocIndices[allocIndices.length - 1];
        const entry = {
          bandId: band.id,
          bandName: band.name,
          day,
          startTime: minutesToTime(slotMinutes[firstIdx]),
          endTime: minutesToTime(slotMinutes[lastIdx] + 60),
          studioId: studio.id,
          studioName: studio.name,
          hours: allocIndices.length,
          members: band.members.slice()
        };
        // debug log allocation
        console.log(`ALLOC => ${band.id} @ ${studio.id} day=${day} indices=${allocIndices.join(',')}`);
        // show studioBooked status for these indices
        const sb = studioBooked[studio.id][day] || [];
        console.log(` studioBooked before: [${allocIndices.map(i => sb[i] ? 1 : 0).join(',')}]`);
        schedules.push(entry);

        // mark booked - each 1-hour block occupies 2 consecutive 30-min slots
        for (const idx of allocIndices) {
          // studio: mark both this slot and next (30-min each = 1 hour)
          if (!studioBooked[studio.id][day]) studioBooked[studio.id][day] = [];
          studioBooked[studio.id][day][idx] = true;
          if (idx + 1 < slots.length) {
            studioBooked[studio.id][day][idx + 1] = true;
          }
          // members
          for (const uid of band.members) {
            if (!memberBooked[uid][day]) memberBooked[uid][day] = [];
            memberBooked[uid][day].push({ idx, studioId: studio.id });
          }
          // also mark band availability matrix so band isn't reconsidered on overlapping half-slot
          slotAvailable[band.id][day][idx] = false;
          if (idx + 1 < slots.length) slotAvailable[band.id][day][idx + 1] = false;
        }

        band.remaining -= allocIndices.length;
      }
    }
  }

  const unscheduled = validBands.filter(b => b.remaining > 0).map(b => ({bandId: b.id, remaining: b.remaining}));

  return { schedules, unscheduled };
}

// Runner
const dataPath = path.join(__dirname, 'sample_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const studiosPath = path.join(__dirname, 'studios.json');
const studiosData = JSON.parse(fs.readFileSync(studiosPath, 'utf8'));

// Flatten studios: each room becomes a unit with studioId and roomId
const flatRooms = [];
for (const studio of studiosData.studios) {
  for (const room of studio.rooms) {
    flatRooms.push({
      id: `${studio.id}_${room.id}`,
      name: `${studio.name} ${room.name}`,
      tatami: room.tatami,
      capacity: room.estimatedCapacity,
      studioId: studio.id,
      roomId: room.id
    });
  }
}

console.log(`Loaded ${flatRooms.length} studio rooms.`);

const result = runScheduler(data, flatRooms);

// Debug: check schedules for overlaps
console.log('\n=== Checking for overlaps ===');
for (let i = 0; i < result.schedules.length; i++) {
  for (let j = i + 1; j < result.schedules.length; j++) {
    const s1 = result.schedules[i];
    const s2 = result.schedules[j];
    if (s1.day === s2.day && s1.studioId === s2.studioId) {
      const s1Start = timeToMinutes(s1.startTime);
      const s1End = timeToMinutes(s1.endTime);
      const s2Start = timeToMinutes(s2.startTime);
      const s2End = timeToMinutes(s2.endTime);
      if (s1Start < s2End && s2Start < s1End) {
        console.log(`OVERLAP: ${s1.bandName} (${s1.startTime}-${s1.endTime}) vs ${s2.bandName} (${s2.startTime}-${s2.endTime}) at ${s1.studioName}`);
      }
    }
  }
}
console.log('=== End overlap check ===\n');

console.log('Schedules:');
console.log(JSON.stringify(result.schedules, null, 2));
console.log('\nUnscheduled:');
console.log(JSON.stringify(result.unscheduled, null, 2));

fs.writeFileSync(path.join(__dirname, 'schedules_output.json'), JSON.stringify(result, null, 2));
console.log('\nWrote schedules_output.json');
