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

/* =========================
   Event Definitions
========================= */
const EVENTS = [
  { id: "shinkan", label: "新歓", month: 4 },
  { id: "satsuki", label: "皐月", month: 5 },
  { id: "summer_mini", label: "夏ミニ", month: 7 },
  { id: "summer_regular", label: "夏定期", month: 8 },
  { id: "summer_camp", label: "夏合宿", month: 8 },
  { id: "tsukimi", label: "月見", month: 10 },
  { id: "autumn_regular", label: "秋定期", month: 10 },
  { id: "autumn_mini", label: "秋ミニ", month: 11 },
  { id: "christmas", label: "クリラ", month: 12 },
  { id: "winter_mini", label: "冬ミニ", month: 1 },
  { id: "winter_regular", label: "冬定期", month: 2 },
  { id: "spring_camp", label: "春合宿", month: 2 },
  { id: "oikon", label: "追いコン", month: 3 }
];

function isEventWithinSixMonths(eventMonth) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Calculate the event's next occurrence
  let eventYear = currentYear;
  if (eventMonth < currentMonth) {
    // Event is in the next year
    eventYear = currentYear + 1;
  }

  const eventDate = new Date(eventYear, eventMonth - 1, 1);
  const sixMonthsLater = new Date(currentYear, now.getMonth() + 6, now.getDate());

  return eventDate <= sixMonthsLater;
}

function getAvailableEvents() {
  return EVENTS.filter(e => isEventWithinSixMonths(e.month));
}
