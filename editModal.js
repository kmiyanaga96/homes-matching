function togglePart(btn) {
  btn.classList.toggle("active");
  updatePreview();
}

function toggleStatusChip(btn) {
  btn.classList.toggle("active");
  updatePreview();
}

/* Dynamic chips generation for Edit Modal & Account Tab */
function initEditModalStatuses() {
  renderEditModalChips();
  renderAccountTabChips();

  // Bind grade change listeners
  document.getElementById("edit-grade")?.addEventListener("change", renderEditModalChips);
  document.getElementById("acc-grade")?.addEventListener("change", renderAccountTabChips);
}

function getAllowedEvents(grade, allVisible) {
  if (grade === "OB/OG") {
    // Only Satsuki, Tsukimi, Xmas, and Rest(0)
    // Satsuki(5), Tsukimi(10), Xmas(12)
    const allowedNames = ["皐月", "月見", "クリラ", "お休み"];
    return allVisible.filter(ev => allowedNames.includes(ev.name));
  }
  return allVisible;
}

function renderEditModalChips() {
  const container = document.getElementById("status-chips");
  if (!container) return;

  // Remember currently active values to preserve them if possible?
  // Or clear them? If switching to OBOG, invalid ones should be removed.
  // For simplicity, we just rebuild. User has to reselect if they change grade.
  // Ideally we preserve valid ones.
  const currentActive = getActiveChips(".status-chip.active").split("/").filter(Boolean); // Function from editModal but it's local? 
  // Wait, getActiveChips is defined below. 

  // Actually, simply rebuilding is safest.

  const grade = document.getElementById("edit-grade")?.value || "1";
  const visible = getVisibleEvents();
  const allowed = getAllowedEvents(grade, visible);

  container.innerHTML = "";
  allowed.forEach(ev => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
    // If previously selected and still allowed, keep active?
    // Need complex logic or just let user reselect.
    // Re-selecting is safer UI behavior when constraints change.

    btn.dataset.value = ev.name;
    btn.dataset.type = ev.type;
    btn.textContent = ev.name;
    btn.onclick = () => toggleStatusChip(btn);
    container.appendChild(btn);
  });
}


function renderAccountTabChips() {
  const container = document.getElementById("acc-status-chips");
  if (!container) return;

  const grade = document.getElementById("acc-grade")?.value || "1";
  const visible = getVisibleEvents();
  const allowed = getAllowedEvents(grade, visible);

  container.innerHTML = "";
  allowed.forEach(ev => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `acc-status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
    btn.dataset.value = ev.name;
    btn.dataset.type = ev.type;
    btn.textContent = ev.name;
    btn.onclick = () => toggleAccountStatusChip(btn);
    container.appendChild(btn);
  });
}

function toggleAccountStatusChip(btn) {
  btn.classList.toggle("active");
  updateAccountChipStyle(btn);
}

function updateAccountChipStyle(btn) {
  const type = btn.dataset.type || "others";
  const colors = EVENT_COLORS[type] || EVENT_COLORS.others;

  if (btn.classList.contains("active")) {
    // Apply active styles - MUST include 'active' class so it can be toggled off!
    btn.className = `acc-status-chip active px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${colors.active} ${colors.text} ${colors.border} ${colors.ring || ""}`;
  } else {
    // Revert
    btn.className = `acc-status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
  }
}

// Enhance the toggle functions to apply colors based on data-type?
// Currently existing CSS likely handles `.active`. 
// If I want custom colors for active state without writing 13 CSS rules, I can do it in JS.
function updateChipStyle(btn) {
  const type = btn.dataset.type || "others";
  const colors = EVENT_COLORS[type] || EVENT_COLORS.others;

  if (btn.classList.contains("active")) {
    // Apply active styles - MUST include 'active' class
    btn.className = `status-chip active px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${colors.active} ${colors.text} ${colors.border} ${colors.ring || ""}`;
  } else {
    // Revert to default
    btn.className = `status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
  }
}
// Override toggleStatusChip to use style update
function toggleStatusChip(btn) {
  btn.classList.toggle("active");
  updateChipStyle(btn); // Apply color
  updatePreview();
}

// Override for Account chips too
// We need to expose this or bind it.

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

function getActiveChips(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((c) => c.classList.contains("active"))
    .map((c) => c.dataset.value)
    .filter(Boolean)
    .join("/");
}

function setChipsActive(selector, valuesStr) {
  const values = String(valuesStr || "").split("/").filter(Boolean);
  document.querySelectorAll(selector).forEach((btn) => {
    const v = btn.dataset.value;
    const isActive = values.includes(v);
    btn.classList.toggle("active", isActive);

    // Auto-update style if it's a dynamic chip
    // We check if it has 'acc-status-chip' or 'status-chip' class to decide which updater to call?
    // Or just check if `updateAccountChipStyle` exists and applies?
    if (btn.classList.contains("acc-status-chip") && typeof updateAccountChipStyle === "function") {
      updateAccountChipStyle(btn);
    } else if (btn.classList.contains("status-chip") && typeof updateChipStyle === "function") {
      updateChipStyle(btn);
    }
  });
}

/* =========================
   Account Tab
========================= */
function fillAccountFormFromAuth() {
  const label = document.getElementById("account-id-label");
  if (label) label.innerText = `@${authId || ""}`;

  const me = (allMembers || []).find((m) => String(m.id) === String(authId));
  const nameEl = document.getElementById("acc-name");
  const gradeEl = document.getElementById("acc-grade");
  const commentEl = document.getElementById("acc-comment");

  if (nameEl) nameEl.value = me?.name || "";
  if (gradeEl) gradeEl.value = me?.grade || "1";
  if (commentEl) commentEl.value = me?.comment || "";

  setChipsActive(".acc-part-chip", me?.part || "");
  setChipsActive(".acc-status-chip", me?.status || "");
}

function bindAccountChips() {
  document.querySelectorAll(".acc-part-chip").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("active"));
  });
  document.querySelectorAll(".acc-status-chip").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("active"));
  });
}

async function saveAccount() {
  if (!hasAuth()) {
    alert("ログインしてください");
    return;
  }

  const payload = {
    id: authId,
    pass: authPass,
    name: document.getElementById("acc-name")?.value || "",
    grade: document.getElementById("acc-grade")?.value || "",
    part: getActiveChips(".acc-part-chip"),
    status: getActiveChips(".acc-status-chip"),
    comment: document.getElementById("acc-comment")?.value || "",
  };

  if (!payload.name || !payload.part || !payload.status) {
    alert("必須項目を入力してください");
    return;
  }

  const btn = document.getElementById("btn-account-save");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "保存中...";
  }

  try {
    const resp = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
    const res = await resp.json();
    alert(res.message || (res.success ? "保存しました" : "失敗"));

    if (res.success) {
      await fetchMembers();
      document.getElementById("tab-search")?.click();
    }
  } catch (e) {
    console.error(e);
    alert("失敗");
  }

  if (btn) {
    btn.disabled = false;
    btn.innerText = "保存";
  }
}
