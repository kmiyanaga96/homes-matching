const passInput = document.getElementById("admin-pass"); // ※現状は未使用（将来adminPass導入用）
const titleInput = document.getElementById("notice-title");
const bodyInput = document.getElementById("notice-body");
const publicInput = document.getElementById("notice-public");
const importantInput = document.getElementById("notice-important");
const listEl = document.getElementById("notice-list");

/* =====================
   Fetch (admin: all)
===================== */
async function fetchNotices() {
  try {
    const data = await API.getNoticesAdmin();
    renderNotices(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
    renderNotices([]);
  }
}

function renderNotices(list) {
  listEl.innerHTML = "";

  if (!list.length) {
    listEl.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">お知らせがありません</p>`;
    return;
  }

  list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((n) => {
      const id = n.id || "";
      const title = escapeHtml(n.title || "");
      const body = escapeHtml(n.body || "");
      const created = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";

      const isActive = toBool(n.isActive);
      const isImportant = toBool(n.isImportant);

      const bg = isImportant ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100";
      const inactive = !isActive ? "opacity-70" : "";

      const wrap = document.createElement("div");
      wrap.className = `rounded-xl shadow p-3 border flex justify-between items-start gap-3 ${bg} ${inactive}`;

      wrap.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm text-slate-800 truncate">${title}</h3>
            ${isImportant ? `<span class="text-[10px] font-bold text-rose-600">重要</span>` : ``}
            ${isActive ? `` : `<span class="text-[10px] font-bold text-slate-500">非公開</span>`}
          </div>

          <p class="text-xs text-slate-600 whitespace-pre-wrap mt-1">${body}</p>
          <p class="text-[10px] text-slate-400 mt-2">${created}</p>
          <p class="text-[10px] text-slate-400 mt-1">id: <span class="font-mono">${escapeHtml(id)}</span></p>
        </div>

        <div class="shrink-0 flex flex-col items-end gap-2">
          <button
            class="text-xs font-bold px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
            data-id="${escapeHtml(id)}"
            data-next="${isActive ? "false" : "true"}"
            onclick="toggleActiveFromButton(this)"
          >${isActive ? "公開→非公開" : "非公開→公開"}</button>

          <button
            class="text-xs font-bold px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
            data-id="${escapeHtml(id)}"
            data-next="${isImportant ? "false" : "true"}"
            onclick="toggleImportantFromButton(this)"
          >${isImportant ? "重要OFF" : "重要ON"}</button>

          <button
            class="text-rose-600 text-xs font-bold hover:underline"
            data-id="${escapeHtml(id)}"
            onclick="deleteNoticeFromButton(this)"
          >削除</button>
        </div>
      `;

      listEl.appendChild(wrap);
    });
}

/* =====================
   Create
===================== */
async function submitNotice() {
  const title = (titleInput.value || "").trim();
  const body = (bodyInput.value || "").trim();

  if (!title || !body) {
    alert("タイトルと本文は必須です");
    return;
  }

  const payload = {
    title,
    body,
    isActive: !!publicInput.checked,
    isImportant: !!importantInput.checked
  };

  try {
    const data = await API.createNotice(payload);

    if (!data.success) {
      alert(data.message || "失敗");
      return;
    }

    alert("投稿しました");
    titleInput.value = "";
    bodyInput.value = "";
    publicInput.checked = true;
    importantInput.checked = false;

    await fetchNotices();
  } catch (e) {
    console.error(e);
    alert("失敗");
  }
}

/* =====================
   Update (toggle)
===================== */
async function toggleActiveFromButton(btn) {
  const id = btn?.dataset?.id;
  const next = btn?.dataset?.next;
  if (!id) return;

  await updateNotice(id, { isActive: next === "true" });
}

async function toggleImportantFromButton(btn) {
  const id = btn?.dataset?.id;
  const next = btn?.dataset?.next;
  if (!id) return;

  await updateNotice(id, { isImportant: next === "true" });
}

async function updateNotice(id, fields) {
  try {
    const data = await API.updateNotice(id, fields);

    if (!data.success) {
      alert(data.message || "失敗");
      return;
    }

    await fetchNotices();
  } catch (e) {
    console.error(e);
    alert("失敗");
  }
}

/* =====================
   Delete
===================== */
async function deleteNoticeFromButton(btn) {
  const id = btn?.dataset?.id;
  if (!id) return;

  if (!confirm("このお知らせを削除しますか？")) return;

  try {
    const data = await API.deleteNotice(id);

    if (!data.success) {
      alert(data.message || "失敗");
      return;
    }

    await fetchNotices();
  } catch (e) {
    console.error(e);
    alert("失敗");
  }
}

/* =====================
   Utils
===================== */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "on";
}

/* =====================
   Init
===================== */
fetchNotices();
