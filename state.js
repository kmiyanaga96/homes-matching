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

let isLoggedIn = localStorage.getItem("homes_logged_in") === "1";
let activeTab = localStorage.getItem("homes_active_tab") || "search";

function setLoggedIn(v) {
  isLoggedIn = !!v;
  localStorage.setItem("homes_logged_in", isLoggedIn ? "1" : "0");
}

function setActiveTab(v) {
  activeTab = v === "account" ? "account" : "search";
  localStorage.setItem("homes_active_tab", activeTab);
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
   Auth (keep login)
========================= */
let authId = localStorage.getItem("auth_id") || "";
let authPass = localStorage.getItem("auth_pass") || "";

function hasAuth() {
  return !!authId && !!authPass;
}

function setAuth(id, pass) {
  authId = String(id || "").trim();
  authPass = String(pass || "").trim();
  localStorage.setItem("auth_id", authId);
  localStorage.setItem("auth_pass", authPass);
}

function clearAuth() {
  authId = "";
  authPass = "";
  localStorage.removeItem("auth_id");
  localStorage.removeItem("auth_pass");
}
