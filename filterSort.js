/* =========================
   Filter / Sort Bottom Sheet
========================= */
function openFilterSheet(initialTab) {
  const modal = document.getElementById("filter-modal");
  const content = document.getElementById("filter-content");
  if (!modal || !content) return;

  setFilterSheetTab(initialTab || "filter");

  const sortSelect = document.getElementById("sort-mode");
  if (sortSelect) sortSelect.value = sortMode;

  modal.classList.remove("hidden");
  setTimeout(() => {
    content.classList.remove("translate-y-full");
  }, 10);
}

function closeFilterSheet() {
  const modal = document.getElementById("filter-modal");
  const content = document.getElementById("filter-content");
  if (!modal || !content) return;

  content.classList.add("translate-y-full");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

function setFilterSheetTab(tab) {
  const tabFilter = document.getElementById("tab-filter");
  const tabSort = document.getElementById("tab-sort");
  const panelFilter = document.getElementById("panel-filter");
  const panelSort = document.getElementById("panel-sort");

  if (!tabFilter || !tabSort || !panelFilter || !panelSort) return;

  const isFilter = tab === "filter";

  tabFilter.classList.toggle("bg-slate-800", isFilter);
  tabFilter.classList.toggle("text-white", isFilter);
  tabFilter.classList.toggle("bg-slate-100", !isFilter);
  tabFilter.classList.toggle("text-slate-500", !isFilter);

  tabSort.classList.toggle("bg-slate-800", !isFilter);
  tabSort.classList.toggle("text-white", !isFilter);
  tabSort.classList.toggle("bg-slate-100", isFilter);
  tabSort.classList.toggle("text-slate-500", isFilter);

  panelFilter.classList.toggle("hidden", !isFilter);
  panelSort.classList.toggle("hidden", isFilter);
}

function resetFilterSheet() {
  isFavFilterActive = false;

  const favIcon = document.getElementById("fav-filter-icon");
  const favBtn = document.getElementById("filter-fav");
  if (favIcon) favIcon.innerText = "🤍";
  if (favBtn) {
    favBtn.classList.remove("text-rose-500", "border-rose-100");
    favBtn.classList.add("text-gray-400");
  }

  const part = document.getElementById("filter-part");
  const grade = document.getElementById("filter-grade");
  const status = document.getElementById("filter-status");
  if (part) part.value = "";
  if (grade) grade.value = "";
  if (status) status.value = "";

  sortMode = "updatedDesc";
  localStorage.setItem("sort_mode", sortMode);
  const sortSelect = document.getElementById("sort-mode");
  if (sortSelect) sortSelect.value = sortMode;

  applyFilters();
}

function applyFilterSheet() {
  const sortSelect = document.getElementById("sort-mode");
  if (sortSelect) {
    sortMode = sortSelect.value || "updatedDesc";
    localStorage.setItem("sort_mode", sortMode);
  }

  applyFilters();
  closeFilterSheet();
}

function bindFilterSortButtons() {
  document.getElementById("btn-filter")?.addEventListener("click", () => openFilterSheet("filter"));
  document.getElementById("btn-sort")?.addEventListener("click", () => openFilterSheet("sort"));

  document.getElementById("btn-filter-close")?.addEventListener("click", closeFilterSheet);
  document.getElementById("filter-overlay")?.addEventListener("click", closeFilterSheet);

  document.getElementById("tab-filter")?.addEventListener("click", () => setFilterSheetTab("filter"));
  document.getElementById("tab-sort")?.addEventListener("click", () => setFilterSheetTab("sort"));

  document.getElementById("btn-filter-reset")?.addEventListener("click", resetFilterSheet);
  document.getElementById("btn-filter-apply")?.addEventListener("click", applyFilterSheet);

  document.getElementById("filter-fav")?.addEventListener("click", toggleFavFilter);
  document.getElementById("filter-part")?.addEventListener("change", applyFilters);
  document.getElementById("filter-grade")?.addEventListener("change", applyFilters);
  document.getElementById("filter-status")?.addEventListener("change", applyFilters);
}
