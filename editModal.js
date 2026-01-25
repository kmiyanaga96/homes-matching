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
  document.getElementById("acc-name").value = me?.name || "";
  document.getElementById("acc-grade").value = me?.grade || "1";
  document.getElementById("acc-comment").value = me?.comment || "";

  setChipsActive(".part-chip", me?.part || "");
  setChipsActive(".status-chip", me?.status || "");
}

function bindAccountChips() {
  document.querySelectorAll("#view-account .part-chip").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("active"));
  });
  document.querySelectorAll("#view-account .status-chip").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("active"));
  });
}

async function saveAccount() {
  if (!isLoggedIn()) {
    alert("ログインしてください");
    return;
  }

  const payload = {
    id: authId,
    pass: authPass,
    name: document.getElementById("acc-name")?.value || "",
    grade: document.getElementById("acc-grade")?.value || "",
    part: getActiveChips("#view-account .part-chip"),
    status: getActiveChips("#view-account .status-chip"),
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
