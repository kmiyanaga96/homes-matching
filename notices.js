function isUnreadNotice(n) {
  const created = toDateSafe(n.createdAt);
  if (!created) return false;
  if (!lastSeenNoticeAt) return true;
  const seen = toDateSafe(lastSeenNoticeAt);
  if (!seen) return true;
  return created > seen;
}

/* =========================
   Notices (Firebase)
========================= */
async function fetchNotices() {
  try {
    notices = await API.getNotices();
    renderNotices();
    updateNoticeDot();
  } catch (e) {
    console.error("[fetchNotices]", e);
    notices = [];
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
