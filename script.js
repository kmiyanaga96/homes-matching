const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";
let allMembers = [];
let isMenuOpen = false;

// --- 初期読込 ---
async function fetchMembers() {
    const loader = document.getElementById('loading');
    if (loader) loader.classList.remove('hidden');
    try {
        const resp = await fetch(API_URL);
        allMembers = await resp.json();
        renderMembers(allMembers);
    } catch (e) { console.error("Fetch Error:", e); }
    if (loader) loader.classList.add('hidden');
}

function renderMembers(members) {
    const container = document.getElementById('member-list');
    container.innerHTML = members.length === 0 ? '<p class="text-center text-slate-400 py-20 text-xs">まだ誰もいません。<br>一番乗りで登録しよう！</p>' : "";
    
    members.forEach((m, i) => {
        const cardHTML = `
            <div class="bg-white rounded-2xl shadow-sm p-4 flex items-center space-x-3 animate-fadeIn" style="animation-delay: ${i*0.02}s">
                <img src="https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}" class="w-11 h-11 rounded-full bg-slate-100 object-cover">
                <div class="flex-1 min-w-0">
                    <h2 class="font-bold text-slate-700 truncate text-sm">${m.name || '---'}</h2>
                    <p class="text-[10px] text-[#65a30d] font-bold">${m.part || ''} / ${m.grade || '-'}${isNaN(m.grade)?'':'年'}</p>
                    <p class="text-[9px] font-bold text-orange-400 mt-0.5">${m.status || ''}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- メニュー制御 ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const overlay = document.getElementById('menu-overlay');
    const fab = document.getElementById('fab-main');
    const container = document.getElementById('btn-login-container');
    
    if (isMenuOpen) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        fab.style.transform = "rotate(135deg)";
        container.classList.add('fab-child-show');
    } else {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
        fab.style.transform = "rotate(0deg)";
        container.classList.remove('fab-child-show');
    }
}

function openEditModal() {
    if (isMenuOpen) toggleMenu();
    document.getElementById('fab-group').classList.add('hidden');
    document.getElementById('refresh-btn').classList.add('hidden');

    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        const content = document.getElementById('edit-content');
        content.classList.replace('scale-90', 'scale-100');
        content.classList.replace('opacity-0', 'opacity-100');
        updatePreview();
    }, 10);
}

function closeEditModal() {
    const content = document.getElementById('edit-content');
    content.classList.replace('scale-100', 'scale-90');
    content.classList.replace('opacity-100', 'opacity-0');
    setTimeout(() => {
        document.getElementById('edit-modal').classList.add('hidden');
        document.getElementById('fab-group').classList.remove('hidden');
        document.getElementById('refresh-btn').classList.remove('hidden');
    }, 200);
}

// --- プレビュー ---
function updatePreview() {
    const name = document.getElementById('edit-name').value || "お名前";
    const id = document.getElementById('edit-auth-id').value;
    const part = document.getElementById('edit-part').value || "パート";
    const grade = document.getElementById('edit-grade').value;

    const preview = document.getElementById('edit-preview-card');
    preview.innerHTML = `
        <div class="flex items-center space-x-3 p-1 opacity-60">
            <img src="https://unavatar.io/twitter/${id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(name)}" class="w-8 h-8 rounded-full">
            <div>
                <p class="font-bold text-[10px] text-slate-700">${name}</p>
                <p class="text-[8px] text-lime-600 font-bold">${part} / ${grade}年</p>
            </div>
        </div>`;
}

// --- 確定送信 ---
async function handleFinalize() {
    const btn = document.getElementById('btn-finalize');
    const payload = {
        name: document.getElementById('edit-name').value,
        grade: document.getElementById('edit-grade').value,
        part: document.getElementById('edit-part').value,
        status: document.getElementById('edit-status').value,
        comment: document.getElementById('edit-comment').value,
        id: document.getElementById('edit-auth-id').value,
        pass: document.getElementById('edit-pass').value
    };

    if (!payload.id || !payload.pass) return alert("IDとパスワードは必須です");

    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await resp.json();
        alert(res.message);
        if (res.success) {
            closeEditModal();
            fetchMembers();
        }
    } catch (e) { alert("通信失敗"); }
    btn.disabled = false;
    btn.innerText = "確定";
}

// イベント紐付け
document.getElementById('fab-main').addEventListener('click', toggleMenu);
document.getElementById('btn-login-open').addEventListener('click', openEditModal);
document.getElementById('refresh-btn').addEventListener('click', fetchMembers);
document.querySelectorAll('#edit-modal input, #edit-modal select, #edit-modal textarea').forEach(el => {
    el.addEventListener('input', updatePreview);
});

fetchMembers();