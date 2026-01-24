const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";

/* =========================
   State
========================= */
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem("fav_members") || "[]");
let isMenuOpen = false;
let isFavFilterActive = false;

let notices = [];
let lastSeenNoticeAt = localStorage.getItem("notice_last_seen_at"); // ISO文字列

/* =========================
   Helpers
========================= */
function toIsoStringSafe(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString();
}
function toDateSafe(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}
function isUnreadNotice(n) {
  const created = toDateSafe(n.createdAt);
  if (!created) return false;
  if (!lastSeenNoticeAt) return true;
  const seen = toDateSafe(lastSeenNoticeAt);
  if (!seen) return true;
  return created > seen;
}

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
   Members: Filter
========================= */
function applyFilters() {
  const nameVal = document.getElementById("search-name").value.toLowerCase();
  const partVal = document.getElementById("filter-part").value;
  const gradeVal = document.getElementById("filter-grade").value;
  const statusVal = document.getElementById("filter-status").value;

  const filtered = allMembers.filter((m) => {
    const matchName = (m.name || "").toLowerCase().includes(nameVal);
    const matchPart = partVal === "" || ((m.part || "").split("/").includes(partVal));
    const matchGrade = gradeVal === "" || String(m.grade) === gradeVal;
    const matchStatus = statusVal === "" || ((m.status || "").split("/").includes(statusVal));
    const matchFav = !isFavFilterActive || favorites.includes(m.id);
    return matchName && matchPart && matchGrade && matchStatus && matchFav;
  });

  renderMembers(filtered);
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
          <a href="https://twitter.com/${m.id}" target="_blank"
             class="text-sky-500 text-[10px] font-bold">@${m.id || ""}</a>
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
  }
  const icon = document.getElementById("fav-filter-icon");
  if (icon) icon.innerText = isFavFilterActive ? "❤️" : "🤍";

  applyFilters();
}

/* =========================
   Edit Modal (Members)
========================= */
function togglePart(btn) {
  btn.classList.toggle("active");
  updatePreview();
}

function toggleStatusChip(btn) {
  btn.classList.toggle("active");
  updatePreview();
}

function openEditModal() {
  if (isMenuOpen) toggleMenu();

  const modal = document.getElementById("edit-modal");
  const content = document.getElementById("edit-content");
  if (!modal || !content) return;

  modal.classList.remove("hidden");

  document.querySelectorAll(".part-chip, .status-chip").forEach((c) => c.classList.remove("active"));

  setTimeout(() => {
    content.classList.replace("scale-90", "scale-100");
    content.classList.replace("opacity-0", "opacity-100");
  }, 10);

  updatePreview();
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  const content = document.getElementById("edit-content");
  if (!modal || !content) return;

  content.classList.replace("scale-100", "scale-90");
  content.classList.replace("opacity-100", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

function updatePreview() {
  const id = document.getElementById("edit-auth-id")?.value || "";
  const preview = document.getElementById("edit-preview-card");
  if (!preview) return;

  preview.innerHTML = `
    <div class="flex items-center space-x-2 p-2">
      <div class="w-9 h-9 rounded-full bg-slate-200"></div>
      <div class="min-w-0">
        <div class="text-[10px] font-bold text-slate-600">@${id || "ID"}</div>
        <div class="text-[9px] text-slate-400">プレビュー</div>
      </div>
    </div>
  `;
}

async function handleFinalize() {
  const btn = document.getElementById("btn-finalize");
  const getChips = (selector) =>
    Array.from(document.querySelectorAll(selector))
      .map((c) => c.dataset.value)
      .filter(Boolean)
      .join("/");

  const payload = {
    name: document.getElementById("edit-name")?.value || "",
    grade: document.getElementById("edit-grade")?.value || "",
    part: getChips(".part-chip.active"),
    status: getChips(".status-chip.active"),
    comment: document.getElementById("edit-comment")?.value || "",
    id: document.getElementById("edit-auth-id")?.value || "",
    pass: document.getElementById("edit-pass")?.value || "",
  };

  if (!payload.name || !payload.id || !payload.part || !payload.status || !/^\d{4}$/.test(payload.pass)) {
    alert("必須項目をすべて入力してください（PWは数字4桁）");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "送信中...";
  }

  try {
    const resp = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
    const res = await resp.json();
    alert(res.message);

    if (res.success) {
      closeEditModal();
      fetchMembers();
    }
  } catch (e) {
    console.error(e);
    alert("失敗");
  }

  if (btn) {
    btn.disabled = false;
    btn.innerText = "確定";
  }
}

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
   Notices (GAS)
========================= */
async function fetchNotices() {
  try {
    const resp = await fetch(`${API_URL}?type=notices`);
    const data = await resp.json();

    if (Array.isArray(data)) {
      notices = data;
    } else {
      notices = [];
      console.warn("notices response:", data);
    }

    renderNotices();
    updateNoticeDot();
  } catch (e) {
    console.error(e);
  }
}

function renderNotices() {
  const list = document.getElementById("notice-list");
  if (!list) return;

  list.innerHTML = "";

  if (!notices.length) {
    list.innerHTML = `<p class="text-xs text-slate-400 text-center">まだお知らせはありません</p>`;
    return;
  }

  const normal = [
    { bg: "#fefce8", bd: "#fde68a", bar: "#facc15" },
    { bg: "#ecfccb", bd: "#bef264", bar: "#84cc16" },
    { bg: "#e0f2fe", bd: "#bae6fd", bar: "#38bdf8" },
  ];
  const important = { bg: "#ffe4e6", bd: "#fda4af", bar: "#fb7185" };

  notices.forEach((n, idx) => {
    const imp =
      String(n.isImportant).toLowerCase() === "true" ||
      n.isImportant === true ||
      n.isImportant === 1;

    const c = imp ? important : normal[idx % normal.length];

    const created = toDateSafe(n.createdAt);
    const dateLabel = created ? created.toLocaleString() : "";

    const newBadge = isUnreadNotice(n)
      ? `<span class="inline-block text-[9px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm mr-2" style="background:${c.bar};">NEW</span>`
      : "";

    const card = `
      <div class="rounded-2xl p-3 border shadow-md" style="background:${c.bg}; border-color:${c.bd};">
        <div class="h-1.5 rounded-full mb-2" style="background:${c.bar};"></div>

        <div class="flex items-center justify-between">
          <div class="flex items-center min-w-0">
            ${newBadge}
            <p class="text-xs font-bold text-slate-700 truncate">
              ${imp ? "📌 " : ""}${n.title || ""}
            </p>
          </div>
          ${imp ? `<span class="text-[10px] font-bold" style="color:${c.bar};">重要</span>` : ``}
        </div>

        <p class="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">${n.body || ""}</p>
        <p class="text-[9px] text-slate-400 mt-2">${dateLabel}</p>
      </div>
    `;
    list.insertAdjacentHTML("beforeend", card);
  });
}

function updateNoticeDot() {
  const dot = document.getElementById("notice-dot");
  if (!dot) return;

  const hasUnread = notices.some(isUnreadNotice);
  dot.classList.toggle("hidden", !hasUnread);
}

function openNoticeModal() {
  const modal = document.getElementById("notice-modal");
  const content = document.getElementById("notice-content");
  if (!modal || !content) return;

  renderNotices();

  modal.classList.remove("hidden");
  setTimeout(() => {
    content.classList.remove("translate-y-full");
    modal.classList.add("show");
  }, 10);

  lastSeenNoticeAt = new Date().toISOString();
  localStorage.setItem("notice_last_seen_at", lastSeenNoticeAt);
  updateNoticeDot();
}

function closeNoticeModal() {
  const modal = document.getElementById("notice-modal");
  const content = document.getElementById("notice-content");
  if (!modal || !content) return;

  content.classList.add("translate-y-full");
  modal.classList.remove("show");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

/* =========================
   Events / Init
========================= */
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

fetchMembers();
fetchNotices();
