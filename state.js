const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";

/* =========================
   State (shared)
========================= */
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem("fav_members") || "[]");
let isMenuOpen = false;
let isFavFilterActive = false;

let notices = [];
let lastSeenNoticeAt = localStorage.getItem("notice_last_seen_at"); // ISO文字列

let sortMode = localStorage.getItem("sort_mode") || "updatedDesc";

// 認証関連はsessionStorage（タブを閉じるとログアウト）
let isLoggedIn = sessionStorage.getItem("homes_logged_in") === "1";
let activeTab = sessionStorage.getItem("homes_active_tab") || "search";

function setLoggedIn(v) {
  isLoggedIn = !!v;
  sessionStorage.setItem("homes_logged_in", isLoggedIn ? "1" : "0");
}

function setActiveTab(v) {
  activeTab = v === "account" ? "account" : "search";
  sessionStorage.setItem("homes_active_tab", activeTab);
}


/* =========================
   Helpers (shared)
========================= */
function toIsoStringSafe(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString();
}

function toDateSafe(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

/* ===== sorting helpers ===== */
function gradeToNumber(g) {
  if (String(g).trim() === "OB/OG") return 5;
  const n = Number(g);
  return Number.isFinite(n) ? n : 999;
}

const PART_ORDER = ["Vo", "Gt", "Key", "Ba", "Dr"];
function partRank(partStr) {
  const parts = String(partStr || "").split("/").filter(Boolean);
  let best = 999;
  parts.forEach((p) => {
    const idx = PART_ORDER.indexOf(p);
    if (idx !== -1) best = Math.min(best, idx);
  });
  return best;
}

/* ===== Event / Status Helpers ===== */
function getVisibleEvents() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12

  // 6 months window
  const months = [];
  for (let i = 0; i < 6; i++) {
    let m = currentMonth + i;
    if (m > 12) m -= 12;
    months.push(m);
  }

  // Filter events: Check if month is in window OR month is 0 (always visible 'Rest')
  const visible = EVENT_DEFINITIONS.filter(ev => ev.month === 0 || months.includes(ev.month));

  // Sort Logic:
  // User request: "4月⇒翌年3月⇒翌年度"
  // Even if we have [Feb(2), Apr(4)], "Apr" comes first in our Definition list.
  // If the user wants "Time based" sort (Feb -> Apr), we need to shift/rotate.
  // BUT the user said "Edit screen ... is 4=>3". This implies preserving the Academic List order.
  // So we just return the filtered list as is (since EVENT_DEFINITIONS is already 4..3).
  // "Rest" (month 0) is at the end of definitions, so it appears at the end.
  return visible;
}

function getEventDef(name) {
  return EVENT_DEFINITIONS.find(e => e.name === name);
}

function getEventColor(name) {
  const def = getEventDef(name);
  if (!def) return EVENT_COLORS.others; // Default fallback
  return EVENT_COLORS[def.type] || EVENT_COLORS.others;
}

function updatedAtToTime(m) {
  const d = toDateSafe(m.updatedAt);
  return d ? d.getTime() : 0;
}

/* =========================
   Auth (session only)
========================= */
let authId = sessionStorage.getItem("auth_id") || "";
let authPass = sessionStorage.getItem("auth_pass") || "";

function hasAuth() {
  return !!authId && !!authPass;
}

function setAuth(id, pass) {
  authId = String(id || "").trim();
  authPass = String(pass || "").trim();
  sessionStorage.setItem("auth_id", authId);
  sessionStorage.setItem("auth_pass", authPass);
}

function clearAuth() {
  authId = "";
  authPass = "";
  sessionStorage.removeItem("auth_id");
  sessionStorage.removeItem("auth_pass");
}
