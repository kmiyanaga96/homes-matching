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

  window.openEditModal = window.openEditModal || openEditModal;
  window.closeEditModal = window.closeEditModal || closeEditModal;
  window.handleFinalize = window.handleFinalize || handleFinalize;
  window.togglePart = window.togglePart || togglePart;
  window.toggleStatusChip = window.toggleStatusChip || toggleStatusChip;

  window.openNoticeModal = window.openNoticeModal || openNoticeModal;
  window.closeNoticeModal = window.closeNoticeModal || closeNoticeModal;

  document.getElementById("search-name")?.addEventListener("input", applyFilters);
  document.getElementById("fab-main")?.addEventListener("click", () => {
    if (!isLoggedIn) {
      openLoginModal();
    } else {
      goTab("account");
    }
  });

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
    const fab = document.getElementById("fab-main");
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
        sessionStorage.setItem("homes_login_id", id);
        sessionStorage.setItem("homes_first_login", "1");
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
      sessionStorage.setItem("homes_login_id", id);
      sessionStorage.removeItem("homes_first_login");

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

  // 認証状態の整合性チェック：isLoggedInがtrueでも認証情報がなければログアウト扱い
  if (isLoggedIn && !hasAuth()) {
    setLoggedIn(false);
    clearAuth();
    sessionStorage.removeItem("homes_login_id");
    sessionStorage.removeItem("homes_first_login");
  }

  updateTopTabsVisibility();
  applyTabUI(activeTab);

  updateAccountFabVisibility();
  bindAccountChips();

  if (isLoggedIn && sessionStorage.getItem("homes_first_login") === "1") {
    sessionStorage.removeItem("homes_first_login");
    goTab("account");
  }

  fetchMembers();
  fetchNotices();
})();
