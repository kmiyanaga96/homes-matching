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
  const visible = getVisibleEvents();

  // 1. Edit Modal Chips
  const container = document.getElementById("status-chips");
  if (container) {
    container.innerHTML = "";
    visible.forEach(ev => {
      const col = getEventColor(ev.name);
      // Use pastel background for chip?
      // User said: "Select multiple options... Color coding... Pastel tones consistent with design"
      // The current design uses `bg-slate-50` for inactive and `active` class handles logic?
      // Existing chips: `bg-slate-50 text-slate-500 ... border-transparent`.
      // When active: usually becomes colored.
      // But here we want the chips to HAVE colors to distinguish them?
      // Or only when selected?
      // User: "Improve color unified display... Color coding for visual clarity."
      // In the *modal*, it's good to show the color hint.
      // But commonly, multiple choice chips are neutral until selected.
      // HOWEVER, the user specifically mentioned color coding strategies.
      // Let's make them colored by default but faded, and stronger when active?
      // Or stick to the current "active" class logic but add the specific color class when active.

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
      btn.dataset.value = ev.name;
      btn.textContent = ev.name;
      btn.onclick = () => toggleStatusChip(btn);

      // We can add a custom attribute or store the color class to apply on toggling?
      // For now, let's keep simple `active` toggle in JS, but we need to inject CSS or handle style in `updatePreview` / css?
      // Actually `toggleStatusChip` just toggles `.active`.
      // We should probably modify `toggleStatusChip` to apply specific colors?
      // Or we can just use the `getEventColor` in the CSS or inline style?
      // Let's add specific classes to the button itself for "type".
      // But `bg-slate-50` is hardcoded.

      // Let's change the strategy:
      // The chips will use the predefined colors but maybe a "faint" version if not active?
      // Or just standard "Slate 50" -> "Color" when active.
      // To do this, we need to know WHICH color to apply.
      // We can set `data-type="official"` etc.
      btn.dataset.type = ev.type;

      container.appendChild(btn);
    });
  }

  // 2. Account Tab Chips
  const accContainer = document.querySelector("#view-account .flex-wrap[id='acc-status-container']"); // Wait, id?
  // Checking index.html... 
  // Line 138: <div class="flex flex-wrap gap-1.5"> (no id)
  // I need to identify it. It's inside `.space-y-1.5` after "次いつ組む？".
  // Best to add an ID to that container in index.html first? 
  // FOR NOW: I will update index.html to add IDs to these containers to be safe.
  // OR I can use `document.querySelectorAll` and find the one containing `acc-status-chip`?
  // But I want to empty it.

  // Let's assume I will add `id="acc-status-chips"` to index.html in the next step.
  const accContainerRef = document.getElementById("acc-status-chips");
  if (accContainerRef) {
    accContainerRef.innerHTML = "";
    visible.forEach(ev => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `acc-status-chip px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-transparent transition-all`;
      btn.dataset.value = ev.name;
      btn.dataset.type = ev.type;
      btn.textContent = ev.name;
      // The bindAccountChips function adds listeners, but here we create dynamic.
      // So add listener directly.
      btn.onclick = () => btn.classList.toggle("active");
      accContainerRef.appendChild(btn);
    });
  }
}

// Enhance the toggle functions to apply colors based on data-type?
// Currently existing CSS likely handles `.active`. 
// If I want custom colors for active state without writing 13 CSS rules, I can do it in JS.
function updateChipStyle(btn) {
  const type = btn.dataset.type || "others";
  const colors = EVENT_COLORS[type] || EVENT_COLORS.others;

  if (btn.classList.contains("active")) {
    // Apply active styles
    btn.className = `status-chip px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${colors.active} ${colors.text} ${colors.border} ${colors.ring || ""}`;
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
    btn.classList.toggle("active", values.includes(v));
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
