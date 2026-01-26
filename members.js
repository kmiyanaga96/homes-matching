/* =========================
   Members: Fetch
========================= */
async function fetchMembers() {
  const loader = document.getElementById("loading");
  if (loader) loader.classList.remove("hidden");

  try {
    const resp = await fetch(API_URL);
    allMembers = await resp.json();
    applyFilters();
  } catch (e) {
    console.error(e);
  }

  if (loader) loader.classList.add("hidden");
}

/* =========================
   Members: Filter + Sort
========================= */
function applyFilters() {
  const nameVal = (document.getElementById("search-name")?.value || "").toLowerCase();
  const partVal = document.getElementById("filter-part")?.value || "";
  const gradeVal = document.getElementById("filter-grade")?.value || "";
  const statusVal = document.getElementById("filter-status")?.value || "";

  const filtered = allMembers.filter((m) => {
    const matchName = (m.name || "").toLowerCase().includes(nameVal);
    const matchPart = partVal === "" || ((m.part || "").split("/").includes(partVal));
    const matchGrade = gradeVal === "" || String(m.grade) === gradeVal;
    const matchStatus = statusVal === "" || ((m.status || "").split("/").includes(statusVal));
    const matchFav = !isFavFilterActive || favorites.includes(m.id);
    return matchName && matchPart && matchGrade && matchStatus && matchFav;
  });

  const sorted = filtered.slice().sort((a, b) => {
    if (sortMode === "updatedDesc") {
      const ta = updatedAtToTime(a);
      const tb = updatedAtToTime(b);
      if (tb !== ta) return tb - ta;

      const ga = gradeToNumber(a.grade);
      const gb = gradeToNumber(b.grade);
      if (ga !== gb) return ga - gb;

      const pa = partRank(a.part);
      const pb = partRank(b.part);
      if (pa !== pb) return pa - pb;

      return String(a.name || "").localeCompare(String(b.name || ""), "ja");
    }

    const ga = gradeToNumber(a.grade);
    const gb = gradeToNumber(b.grade);
    if (ga !== gb) return sortMode === "gradeAsc" ? ga - gb : gb - ga;

    const pa = partRank(a.part);
    const pb = partRank(b.part);
    if (pa !== pb) return pa - pb;

    return String(a.name || "").localeCompare(String(b.name || ""), "ja");
  });

  renderMembers(sorted);
}

/* =========================
   Members: Render
========================= */
function renderMembers(displayList) {
  const container = document.getElementById("member-list");
  container.innerHTML =
    displayList.length === 0
      ? '<p class="text-center text-slate-400 py-20 text-xs">メンバーが見つかりません</p>'
      : "";

  displayList.forEach((m, i) => {
    const isFav = favorites.includes(m.id);
    const isOBOG = m.grade === "OB/OG";
    const obogClass = isOBOG ? "card-obog" : "";

    const parts = (m.part || "").split("/").filter(Boolean);
    const partTags = parts
      .map(
        (p) =>
          `<span class="part-tag-${p} px-2 py-0.5 rounded text-[9px] font-bold mr-1">${p}</span>`
      )
      .join("");

    const statusDisplay = (m.status || "").split("/").filter(Boolean).join(", ");

    const statusList = (m.status || "").split("/").filter(Boolean);

    // Filter out invalid/invisible events (optional: remove old events not in window?)
    // User said: "Ranges outside statuses are hidden". 
    // So we check against getVisibleEvents() OR we just check against the entire definitions?
    // "Range outside statuses are hidden" likely means "Only show future-relevant statuses".
    // I will filter by getVisibleEvents().
    const visibleEvents = getVisibleEvents().map(e => e.name);
    const validStatus = statusList.filter(s => visibleEvents.includes(s));

    let statusHTML = "";
    if (validStatus.length > 0) {
      statusHTML = `<div class="mt-3 px-1 cursor-pointer" onclick="toggleCard('${m.id}')">`;
      statusHTML += `<div class="flex flex-wrap gap-1.5 items-center mb-2">`;

      // "Recruiting" Badge
      statusHTML += `<span class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 border border-slate-300">募集中</span>`;

      // Status Chips
      validStatus.forEach(s => {
        const col = getEventColor(s);
        statusHTML += `<span class="${col.bg} ${col.text} ${col.border} border px-2 py-0.5 rounded text-[10px] font-bold">${s}</span>`;
      });

      statusHTML += `</div>`; // end flex

      statusHTML += `<div class="comment-area">
            <p class="text-xs text-slate-500 leading-relaxed">
              ${m.comment || "イエッタイガー！"}
            </p>
          </div>
        </div>`;
    } else {
      // No recruiting status -> Just comment (or hidden if we strictly follow "Recruiting only" filtering?)
      // User said: "Filter by status: Recruiting only display". 
      // "募集中のみ表示" might mean "Only show users who are recruiting"?
      // "Filtering is specific status filtering. Display only recruiting... header 'Recruiting'..."
      // It sounds like the "Recruiting" badge is always visible if they have a status.
      // If they don't have a status, do we show the card?
      // Default behavior: show card.
      // But if filtering is active, it will filter.

      statusHTML = `<div class="mt-3 px-1 cursor-pointer" onclick="toggleCard('${m.id}')">
          <div class="comment-area">
            <p class="text-xs text-slate-500 leading-relaxed">
              ${m.comment || "イエッタイガー！"}
            </p>
          </div>
        </div>`;
    }

    const cardHTML = `
      <div id="card-${m.id}" class="bg-white rounded-[2rem] shadow-sm pt-5 px-5 pb-4 animate-fadeIn ${obogClass}" style="animation-delay:${i * 0.02}s">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4 flex-1">
            <img src="https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || "")}"
                 class="w-12 h-12 rounded-full bg-slate-100 object-cover">
            <div class="flex-1 min-w-0">
              <h2 class="font-bold text-slate-700 text-sm">
                ${m.name || ""}
                <span class="text-[10px] text-slate-400 font-normal">
                  / ${m.grade || ""}${isNaN(m.grade) ? "" : "年"}
                </span>
              </h2>
              <div class="flex mt-1">${partTags}</div>
            </div>
          </div>

          <div class="flex items-center">
            <a href="https://twitter.com/${m.id}" target="_blank" rel="noopener noreferrer" class="x-btn mr-1" aria-label="X profile" title="X">
              <svg class="x-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.9 2H22l-6.7 7.7L23 22h-6.8l-5.3-6.9L4.9 22H2l7.2-8.3L1 2h7l4.8 6.3L18.9 2z"></path>
              </svg>
            </a>
            <button onclick="toggleFavorite('${m.id}')" class="p-2 text-xl">
              <span id="heart-${m.id}" class="${isFav ? "is-fav" : "text-slate-200"}">
                ${isFav ? "❤️" : "♡"}
              </span>
            </button>
          </div>
        </div>

        ${statusHTML}
      </div>
    `;

    container.insertAdjacentHTML("beforeend", cardHTML);
  });
}

/* =========================
   Favorites / UI
========================= */
function toggleCard(id) {
  const el = document.getElementById(`card-${id}`);
  if (el) el.classList.toggle("card-open");
}

function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  index === -1 ? favorites.push(id) : favorites.splice(index, 1);
  localStorage.setItem("fav_members", JSON.stringify(favorites));
  applyFilters();
}

function toggleFavFilter() {
  isFavFilterActive = !isFavFilterActive;

  const btn = document.getElementById("filter-fav");
  if (btn) {
    btn.classList.toggle("text-rose-500", isFavFilterActive);
    btn.classList.toggle("border-rose-100", isFavFilterActive);
    btn.classList.toggle("text-gray-400", !isFavFilterActive);
  }

  const icon = document.getElementById("fav-filter-icon");
  if (icon) icon.innerText = isFavFilterActive ? "❤️" : "🤍";

  applyFilters();
}

