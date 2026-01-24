const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem('homes_favs')) || [];
let isMenuOpen = false;

// --- 初期化 ---
async function fetchMembers() {
    const loader = document.getElementById('loading');
    loader.classList.remove('hidden');
    try {
        const response = await fetch(API_URL);
        allMembers = await response.json();
        renderMembers(allMembers);
        loader.classList.add('hidden');
    } catch (e) {
        alert("データの取得に失敗しました");
    }
}

// --- カード描画 ---
function renderMembers(members) {
    const container = document.getElementById('member-list');
    container.innerHTML = "";
    members.forEach((m, i) => {
        const cardHTML = `
            <div class="bg-white rounded-3xl shadow-sm p-5 flex items-center space-x-4 animate-fadeIn" style="animation-delay: ${i*0.05}s">
                <img src="https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${m.name}" class="w-14 h-14 rounded-full bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h2 class="font-bold text-slate-700 truncate">${m.name}</h2>
                    <p class="text-[11px] text-[#65a30d] font-bold">${m.part} / ${m.grade}${isNaN(m.grade)?'':'年'}</p>
                    <p class="text-[10px] font-bold text-orange-400 mt-0.5">${m.status}</p>
                    <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${m.comment || ''}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- スピードダイアル制御 ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const overlay = document.getElementById('menu-overlay');
    const fab = document.getElementById('fab-main');
    const btn = document.getElementById('btn-login-open');
    
    if (isMenuOpen) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        fab.classList.add('active');
        btn.classList.add('fab-child-show');
    } else {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
        fab.classList.remove('active');
        btn.classList.remove('fab-child-show');
    }
}

// --- 編集・確定処理 ---
function openEditModal() {
    toggleMenu();
    updatePreview();
    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('edit-content').classList.add('show'), 10);
}

function closeEditModal() {
    document.getElementById('edit-content').classList.remove('show');
    setTimeout(() => document.getElementById('edit-modal').classList.add('hidden'), 300);
}

function updatePreview() {
    const m = {
        name: document.getElementById('edit-name').value || "名前",
        grade: document.getElementById('edit-grade').value,
        part: document.getElementById('edit-part').value || "パート",
        status: document.getElementById('edit-status').value,
        comment: document.getElementById('edit-comment').value || "コメントがここに入ります",
        id: document.getElementById('edit-auth-id').value
    };
    const previewContainer = document.getElementById('edit-preview-card');
    previewContainer.innerHTML = `
        <div class="flex items-center space-x-3 p-2 scale-90">
            <img src="https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${m.name}" class="w-12 h-12 rounded-full bg-slate-200">
            <div class="flex-1 min-w-0">
                <p class="font-bold text-xs text-slate-700">${m.name}</p>
                <p class="text-[9px] text-[#65a30d]">${m.part} / ${m.grade}${isNaN(m.grade)?'':'年'}</p>
                <p class="text-[9px] text-orange-400 font-bold">${m.status}</p>
            </div>
        </div>`;
}

async function handleFinalize() {
    const btn = document.getElementById('btn-finalize');
    const data = {
        name: document.getElementById('edit-name').value,
        grade: document.getElementById('edit-grade').value,
        part: document.getElementById('edit-part').value,
        status: document.getElementById('edit-status').value,
        comment: document.getElementById('edit-comment').value,
        id: document.getElementById('edit-auth-id').value,
        pass: document.getElementById('edit-pass').value
    };

    if (!data.id || !data.pass) return alert("IDとパスワードは必須です");

    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        const resp = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const res = await resp.json();
        
        if (res.success) {
            alert(res.message);
            closeEditModal();
            fetchMembers(); // 再読み込み
        } else {
            alert(res.message);
        }
    } catch (e) {
        alert("エラーが発生しました");
    } finally {
        btn.disabled = false;
        btn.innerText = "確定";
    }
}

// イベント設定
document.getElementById('fab-main').addEventListener('click', toggleMenu);
document.getElementById('btn-login-open').addEventListener('click', openEditModal);
document.querySelectorAll('#edit-modal input, #edit-modal textarea, #edit-modal select').forEach(el => {
    el.addEventListener('input', updatePreview);
});

fetchMembers();