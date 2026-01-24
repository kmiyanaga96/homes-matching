const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem('homes_favs')) || [];
let showOnlyFavs = false;
let currentSort = "update";
let isMenuOpen = false;

const PART_ORDER = { "Vo": 1, "Gt": 2, "Ba": 3, "Dr": 4, "Key": 5 };
const PART_COLORS = { "Vo": "text-pink-400", "Gt": "text-sky-400", "Ba": "text-indigo-400", "Dr": "text-emerald-400", "Key": "text-amber-400" };

// --- ユーティリティ系 ---
function getPartHTML(partStr) {
    return (partStr || "").split(/[/／、, ]/).map(p => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const colorClass = PART_COLORS[trimmed] || "text-[#65a30d]";
        return `<span class="${colorClass}">${trimmed}</span>`;
    }).filter(h => h).join('<span class="text-slate-300 mx-0.5">/</span>');
}

function getGradeValue(grade) {
    if (grade === "卒業生") return 5;
    const num = parseInt(grade);
    return isNaN(num) ? 99 : num;
}

function getPartPriority(partStr) {
    const parts = (partStr || "").split(/[/／、, ]/);
    let minPriority = 99;
    parts.forEach(p => {
        const priority = PART_ORDER[p.trim()];
        if (priority && priority < minPriority) minPriority = priority;
    });
    return minPriority;
}

// --- データ取得・更新 ---
async function fetchMembers() {
    const loader = document.getElementById('loading');
    loader.classList.remove('fade-out');
    try {
        const response = await fetch(API_URL);
        allMembers = await response.json();
        updateList(); 
        loader.classList.add('fade-out');
    } catch (error) {
        loader.innerHTML = `<div class="text-center p-6"><p class="text-gray-400 font-bold">接続エラー</p><button onclick="location.reload()" class="mt-4 px-6 py-2 bg-[#bef264] rounded-full text-xs font-bold shadow-sm">再読み込み</button></div>`;
    }
}

function updateList() {
    const nameQuery = (document.getElementById('search-name').value || "").toLowerCase();
    const gradeQuery = document.getElementById('filter-grade').value;
    const partQuery = document.getElementById('filter-part').value;
    const statusQuery = document.getElementById('filter-status').value;

    let filtered = allMembers.filter(m => {
        const isFav = favorites.includes(m.id);
        const matchFav = !showOnlyFavs || isFav;
        const matchName = (m.name || "").toLowerCase().includes(nameQuery) || (m.comment || "").toLowerCase().includes(nameQuery);
        const matchGrade = gradeQuery === "" || String(m.grade) === gradeQuery;
        const matchPart = partQuery === "" || (m.part || "").includes(partQuery);
        const matchStatus = statusQuery === "" || (m.status || "").includes(statusQuery);
        return matchFav && matchName && matchGrade && matchPart && matchStatus;
    });

    filtered.sort((a, b) => {
        if (currentSort === "update") return 0;
        const gradeA = getGradeValue(a.grade);
        const gradeB = getGradeValue(b.grade);
        if (gradeA !== gradeB) return currentSort === "gradeDesc" ? gradeB - gradeA : gradeA - gradeB;
        return getPartPriority(a.part) - getPartPriority(b.part);
    });

    renderMembers(filtered);
}

// --- カード描画 ---
function generateCardHTML(m, index = 0, isPreview = false) {
    const isFav = favorites.includes(m.id);
    const cardBg = m.grade === "卒業生" ? "bg-slate-100" : "bg-white";
    const iconUrl = m.id ? `https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=cbd5e1` 
                         : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=cbd5e1`;

    return `
        <div class="${cardBg} rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-5 flex items-center space-x-4 relative border border-transparent ${isPreview ? '' : 'animate-fadeIn cursor-pointer hover:border-[#bef264]'}" 
             ${isPreview ? '' : `onclick="openModal('${encodeURIComponent(JSON.stringify(m))}')" style="animation-delay: ${index * 0.03}s"`}>
            <div class="relative flex-shrink-0">
                <img src="${iconUrl}" class="w-16 h-16 rounded-full bg-slate-100 object-cover border-2 border-white">
                ${(m.status !== 'むり') ? '<span class="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-lime-500 border-2 border-white"></span>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h2 class="font-bold text-slate-700 truncate text-base">${m.name || 'Your Name'}</h2>
                    ${isPreview ? '' : `<button onclick="toggleFavorite(event, '${m.id}')" class="p-1 focus:outline-none transition-transform active:scale-125">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isFav ? 'fill-red-500 text-red-500 heart-pop' : 'text-gray-300'}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>`}
                </div>
                <div class="flex items-center space-x-2 mt-0.5">
                    <div class="text-[13px] font-bold flex items-center flex-wrap">${getPartHTML(m.part)}</div>
                    <span class="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">${m.grade || '-'}${isNaN(m.grade) ? '' : '年'}</span>
                </div>
                <p class="text-[10px] font-bold text-orange-400 uppercase tracking-tighter mt-1">${m.status || 'STATUS'}</p>
                <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${m.comment || ''}</p>
            </div>
        </div>`;
}

function renderMembers(members) {
    const listContainer = document.getElementById('member-list');
    listContainer.innerHTML = members.length === 0 ? `<p class="text-center text-gray-400 py-10 text-sm">該当者なし</p>` : "";
    members.forEach((m, index) => {
        listContainer.insertAdjacentHTML('beforeend', generateCardHTML(m, index));
    });
}

// --- スピードダイアル (FAB) 制御 ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const overlay = document.getElementById('menu-overlay');
    const fabMain = document.getElementById('fab-main');
    const btnLogin = document.getElementById('btn-login');
    const btnReg = document.getElementById('btn-register');

    if (isMenuOpen) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        fabMain.classList.add('active');
        btnLogin.classList.add('fab-child-show');
        setTimeout(() => btnReg.classList.add('fab-child-show'), 50);
    } else {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
        fabMain.classList.remove('active');
        btnLogin.classList.remove('fab-child-show');
        btnReg.classList.remove('fab-child-show');
    }
}

// --- アプリ内編集・プレビューロジック ---
let editingMember = null;

function openEditModal() {
    toggleMenu(); // メニューを閉じる
    // 本来はここで「どのデータを編集するか」を選択させますが、今回は「自分のデータ(仮)」として初期値をセット
    editingMember = allMembers[0] || { name: "ゲスト", part: "Gt", grade: "1", status: "ミニライブ", comment: "ここにコメントが入ります", id: "" };
    
    document.getElementById('edit-comment').value = editingMember.comment;
    document.getElementById('edit-status').value = editingMember.status;
    document.getElementById('edit-auth-id').value = editingMember.id;
    
    updatePreview();
    
    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('edit-content').classList.add('show'), 10);
}

function updatePreview() {
    const previewArea = document.getElementById('edit-preview-card');
    const tempMember = {
        ...editingMember,
        comment: document.getElementById('edit-comment').value,
        status: document.getElementById('edit-status').value,
        id: document.getElementById('edit-auth-id').value
    };
    previewArea.innerHTML = generateCardHTML(tempMember, 0, true);
}

function closeEditModal() {
    document.getElementById('edit-content').classList.remove('show');
    setTimeout(() => document.getElementById('edit-modal').classList.add('hidden'), 300);
}

function handleSave() {
    const authId = document.getElementById('edit-auth-id').value;
    // 簡易認証例: スプレッドシート上のIDと一致するかチェック（本来はGAS側で行う）
    if (!authId) {
        alert("本人確認のためXのIDを入力してください");
        return;
    }
    alert("保存リクエストを送信しました（GAS連携は次ステップで実装）");
    closeEditModal();
}

// --- イベントリスナー ---
document.getElementById('fab-main').addEventListener('click', toggleMenu);
document.getElementById('menu-overlay').addEventListener('click', toggleMenu);
document.getElementById('btn-login').addEventListener('click', openEditModal);

document.getElementById('edit-comment').addEventListener('input', updatePreview);
document.getElementById('edit-status').addEventListener('change', updatePreview);
document.getElementById('edit-auth-id').addEventListener('input', updatePreview);

// 検索・フィルタ (既存)
document.getElementById('search-name').addEventListener('input', (e) => {
    document.getElementById('clear-btn').classList.toggle('hidden', e.target.value.length === 0);
    updateList();
});
document.getElementById('clear-btn').addEventListener('click', () => {
    const input = document.getElementById('search-name');
    input.value = ''; updateList(); input.focus();
});
document.getElementById('filter-grade').addEventListener('change', updateList);
document.getElementById('filter-part').addEventListener('change', updateList);
document.getElementById('filter-status').addEventListener('change', updateList);
document.getElementById('filter-fav').addEventListener('click', function() {
    showOnlyFavs = !showOnlyFavs;
    this.classList.toggle('bg-red-50'); this.classList.toggle('text-red-500'); this.classList.toggle('border-red-200');
    updateList();
});
document.getElementById('sort-btn').addEventListener('click', function() {
    const label = document.getElementById('sort-label');
    if (currentSort === "update") { currentSort = "gradeDesc"; label.innerText = "学年降順"; }
    else if (currentSort === "gradeDesc") { currentSort = "gradeAsc"; label.innerText = "学年昇順"; }
    else { currentSort = "update"; label.innerText = "更新順"; }
    updateList();
});

// モーダル (詳細表示用)
function openModal(memberJson) {
    const m = JSON.parse(decodeURIComponent(memberJson));
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const iconUrl = m.id ? `https://unavatar.io/twitter/${m.id}` : `https://ui-avatars.com/api/?name=${m.name}`;
    content.innerHTML = `
        <div class="p-8 text-center animate-fadeIn">
            <img src="${iconUrl}" class="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg mb-4">
            <h2 class="text-2xl font-bold text-slate-700 mb-1">${m.name}</h2>
            <div class="flex items-center justify-center space-x-2 mb-4">
                <div class="font-bold text-sm">${getPartHTML(m.part)}</div>
                <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">${m.grade}${isNaN(m.grade) ? '' : '年'}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl p-6 text-left mb-6 text-sm italic text-slate-500 whitespace-pre-wrap">${m.comment || '（コメントなし）'}</div>
            <button onclick="closeModal()" class="w-full py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl">とじる</button>
        </div>`;
    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
}
function closeModal() {
    const content = document.getElementById('modal-content');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { document.getElementById('detail-modal').classList.add('hidden'); }, 200);
}

const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) { backToTopBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none'); backToTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto'); }
    else { backToTopBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none'); backToTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto'); }
});
backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
document.getElementById('refresh-btn').addEventListener('click', fetchMembers);

fetchMembers();