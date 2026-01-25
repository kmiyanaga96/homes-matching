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

    const cardHTML = `
      <div id="card-${m.id}" class="bg-white rounded-[2rem] shadow-sm p-5 animate-fadeIn ${obogClass}" style="animation-delay:${i * 0.02}s">
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

          <button onclick="toggleFavorite('${m.id}')" class="p-2 text-xl">
            <span id="heart-${m.id}" class="${isFav ? "is-fav" : "text-slate-200"}">
              ${isFav ? "❤️" : "♡"}
            </span>
          </button>
        </div>

        <div class="mt-3 px-1 cursor-pointer" onclick="toggleCard('${m.id}')">
          <p class="text-[10px] text-orange-400 font-bold mb-1">● ${statusDisplay || "未設定"}</p>
          <div class="comment-area">
            <p class="text-[11px] text-slate-500 leading-relaxed">
              ${m.comment || "よろしくお願いします！"}
            </p>
          </div>
        </div>

        <div class="mt-3 flex justify-between items-center border-t border-slate-50 pt-3">
          <a href="https://twitter.com/${m.id}" target="_blank" class="x-btn">
            <svg viewBox="0 0 24 24" class="x-icon" aria-hidden="true">
              <path d="M18.244 2H21l-6.518 7.455L22 22h-6.889l-4.52-5.92L5.56 22H3l7.01-8.02L2 2h7.03l4.087 5.388L18.244 2zm-1.207 18h1.91L8.12 4H6.07l10.967 16z"/>
            </svg>
          </a>
        </div>
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
