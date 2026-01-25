/* =========================
   Menu (FAB)
========================= */
function toggleMenu() {
  isMenuOpen = !isMenuOpen;

  const fab = document.getElementById("fab-main");
  const container = document.getElementById("btn-login-container");
  const overlay = document.getElementById("menu-overlay");

  if (!fab || !container || !overlay) return;

  if (isMenuOpen) {
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("opacity-100"), 10);
    fab.style.transform = "rotate(135deg)";
    container.classList.add("fab-child-show");
  } else {
    overlay.classList.remove("opacity-100");
    setTimeout(() => overlay.classList.add("hidden"), 300);
    fab.style.transform = "rotate(0deg)";
    container.classList.remove("fab-child-show");
  }
}

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

/* =========================
   Boot (split files entry)
========================= */
(() => {
  // 二重起動防止（複数回読み込み・再実行対策）
  if (window.__homesBooted) return;
  window.__homesBooted = true;

  // 既存の inline onclick が生きるように、必要な関数だけ window に生やす
  // （既にwindowにあるなら上書きされるだけで問題なし）
  window.applyFilters = window.applyFilters || applyFilters;
  window.toggleFavFilter = window.toggleFavFilter || toggleFavFilter;
  window.toggleFavorite = window.toggleFavorite || toggleFavorite;
  window.toggleCard = window.toggleCard || toggleCard;
  window.toggleMenu = window.toggleMenu || toggleMenu;

  window.openEditModal = window.openEditModal || openEditModal;
  window.closeEditModal = window.closeEditModal || closeEditModal;
  window.handleFinalize = window.handleFinalize || handleFinalize;
  window.togglePart = window.togglePart || togglePart;
  window.toggleStatusChip = window.toggleStatusChip || toggleStatusChip;

  window.openNoticeModal = window.openNoticeModal || openNoticeModal;
  window.closeNoticeModal = window.closeNoticeModal || closeNoticeModal;

  // イベント登録（分割でどこかに消えた可能性があるので、ここで確実に）
  document.getElementById("search-name")?.addEventListener("input", applyFilters);
  document.getElementById("fab-main")?.addEventListener("click", toggleMenu);
  document.getElementById("btn-login-open")?.addEventListener("click", openEditModal);

  document.getElementById("refresh-btn")?.addEventListener("click", () => {
    fetchMembers();
    fetchNotices();
  });

  document.getElementById("btn-notice")?.addEventListener("click", openNoticeModal);
  document.getElementById("btn-notice-close")?.addEventListener("click", closeNoticeModal);

  const noticeModal = document.getElementById("notice-modal");
  if (noticeModal) {
    const overlay = noticeModal.querySelector(":scope > div.absolute");
    overlay?.addEventListener("click", closeNoticeModal);
  }

  document.getElementById("edit-auth-id")?.addEventListener("input", updatePreview);

  // 初期ロード（分割で呼ばれなくなりがち）
  fetchMembers();
  fetchNotices();
})();
