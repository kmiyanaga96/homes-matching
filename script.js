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
  if (window.__homesBooted) return;
  window.__homesBooted = true;
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

  document.getElementById("search-name")?.addEventListener("input", applyFilters);
  document.getElementById("fab-main")?.addEventListener("click", toggleMenu);

  window.openFilterSheet = window.openFilterSheet || openFilterSheet;
  window.closeFilterSheet = window.closeFilterSheet || closeFilterSheet;
  window.setFilterSheetTab = window.setFilterSheetTab || setFilterSheetTab;
  window.resetFilterSheet = window.resetFilterSheet || resetFilterSheet;
  window.applyFilterSheet = window.applyFilterSheet || applyFilterSheet;

  bindFilterSortButtons?.();

  document.getElementById("refresh-btn")?.addEventListener("click", () => {
    fetchMembers();
    fetchNotices();
  });

  document.getElementById("btn-notice")?.addEventListener("click", openNoticeModal);
  document.getElementById("btn-notice-close")?.addEventListener("click", closeNoticeModal);

  document.getElementById("tab-search")?.addEventListener("click", () => goTab("search"));
  document.getElementById("tab-account")?.addEventListener("click", () => goTab("account"));
  
  document.getElementById("btn-login-open")?.addEventListener("click", () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    switchTab("account");
  });
  document.getElementById("btn-login-cancel")?.addEventListener("click", closeLoginModal);
  document.getElementById("login-overlay")?.addEventListener("click", closeLoginModal);
  document.getElementById("btn-login-submit")?.addEventListener("click", performLogin);

  document.getElementById("login-pass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performLogin();
  });

  const noticeModal = document.getElementById("notice-modal");
  if (noticeModal) {
    const overlay = noticeModal.querySelector(":scope > div.absolute");
    overlay?.addEventListener("click", closeNoticeModal);
  }

  document.getElementById("edit-auth-id")?.addEventListener("input", updatePreview);

  function updateTopTabsVisibility() {
    const el = document.getElementById("header-tabs");
    if (!el) return;
    el.classList.toggle("hidden", !isLoggedIn);
  }

  function applyTabUI(tab) {
    const viewSearch = document.getElementById("view-search");
    const viewAccount = document.getElementById("view-account");
    if (!viewSearch || !viewAccount) return;

    if (tab === "account" && isLoggedIn) {
      viewSearch.classList.add("hidden");
      viewAccount.classList.remove("hidden");
      fillAccountFormFromAuth();
    } else {
      viewSearch.classList.remove("hidden");
      viewAccount.classList.add("hidden");
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    applyTabUI(tab);
  }


  function updateTabHighlight(tab) {
    const tSearch = document.getElementById("tab-search");
    const tAccount = document.getElementById("tab-account");
    if (!tSearch || !tAccount) return;

    const isSearch = tab === "search";

    tSearch.classList.toggle("is-active", isSearch);
    tAccount.classList.toggle("is-active", !isSearch);

    tSearch.setAttribute("aria-selected", isSearch ? "true" : "false");
    tAccount.setAttribute("aria-selected", !isSearch ? "true" : "false");
  }

  function goTab(tab) {
    setActiveTab(tab);
    updateTabHighlight(tab);
    applyTabUI(tab);
  }

  function openLoginModal() {
    const modal = document.getElementById("login-modal");
    const content = document.getElementById("login-content");
    if (!modal || !content) return;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    setTimeout(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }, 10);

    document.getElementById("login-id")?.focus();
  }

  function closeLoginModal() {
    const modal = document.getElementById("login-modal");
    const content = document.getElementById("login-content");
    if (!modal || !content) return;

    content.classList.remove("scale-100", "opacity-100");
    content.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 200);
  }

  function updateAccountFabVisibility() {
    const fab = document.getElementById("fab-group");
    if (!fab) return;

    fab.classList.toggle("hidden", isLoggedIn);
  }

  async function performLogin() {
    const id = (document.getElementById("login-id")?.value || "").trim();
    const pass = (document.getElementById("login-pass")?.value || "").trim();

    if (!id || !/^\d{4}$/.test(pass)) {
      alert("IDとPW（数字4桁）を入力してください");
      return;
    }

    const btn = document.getElementById("btn-login-submit");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "確認中...";
    }

    try {
      const resp = await fetch(API_URL);
      const members = await resp.json();

      const me = Array.isArray(members) ? members.find(m => String(m.id) === String(id)) : null;

      if (!me) {
        setLoggedIn(true);
        setAuth(id, pass);
        localStorage.setItem("homes_login_id", id);
        localStorage.setItem("homes_first_login", "1");
        closeLoginModal();
        updateTopTabsVisibility();
        updateAccountFabVisibility();
        goTab("account");
        return;
      }

      const payload = {
        id,
        pass,
        name: me.name || "",
        grade: me.grade || "",
        part: me.part || "",
        status: me.status || "",
        comment: me.comment || ""
      };

      const post = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
      const res = await post.json();

      if (!res?.success) {
        alert(res?.message || "ログイン失敗");
        return;
      }

      setLoggedIn(true);
      setAuth(id, pass);
      localStorage.setItem("homes_login_id", id);
      localStorage.removeItem("homes_first_login");

      closeLoginModal();
      updateTopTabsVisibility();
      updateAccountFabVisibility();
      goTab("search");
    } catch (e) {
      console.error(e);
      alert("ログイン失敗");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "ログイン";
      }
    }
  }

  updateTopTabsVisibility();
  applyTabUI(activeTab);

  updateAccountFabVisibility();
  bindAccountChips();

  if (isLoggedIn && localStorage.getItem("homes_first_login") === "1") {
    localStorage.removeItem("homes_first_login");
    goTab("account");
  }

  fetchMembers();
  fetchNotices();
})();
