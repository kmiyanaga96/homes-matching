const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec"; 
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem('fav_members') || "[]");
let isMenuOpen = false;
let isFavFilterActive = false;

// --- 読込 ---
async function fetchMembers() {
    const loader = document.getElementById('loading');
    if (loader) loader.classList.remove('hidden');
    try {
        const resp = await fetch(API_URL);
        allMembers = await resp.json();
        renderMembers(allMembers);
    } catch (e) { console.error(e); }
    if (loader) loader.classList.add('hidden');
}

// --- 描画 ---
function renderMembers(members) {
    const container = document.getElementById('member-list');
    const displayList = isFavFilterActive ? members.filter(m => favorites.includes(m.id)) : members;
    
    container.innerHTML = displayList.length === 0 ? '<p class="text-center text-slate-400 py-20 text-xs">メンバーが見つかりません</p>' : "";
    
    displayList.forEach((m, i) => {
        const isFav = favorites.includes(m.id);
        const parts = (m.part || "").split('/');
        const partTags = parts.map(p => `<span class="part-tag-${p} px-2 py-0.5 rounded text-[9px] font-bold mr-1">${p}</span>`).join('');

        const cardHTML = `
            <div id="card-${m.id}" class="bg-white rounded-[2rem] shadow-sm p-5 animate-fadeIn" style="animation-delay: ${i*0.02}s">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <img src="https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}" class="w-12 h-12 rounded-full bg-slate-100 object-cover">
                        <div class="flex-1 min-w-0">
                            <h2 class="font-bold text-slate-700 text-sm">${m.name} <span class="text-[10px] text-slate-400 font-normal">/ ${m.grade}年</span></h2>
                            <div class="flex mt-1">${partTags}</div>
                        </div>
                    </div>
                    <button onclick="toggleFavorite('${m.id}')" class="p-2 text-xl"><span id="heart-${m.id}" class="${isFav ? 'is-fav' : 'text-slate-200'}">${isFav ? '❤️' : '♡'}</span></button>
                </div>
                
                <div class="mt-3 px-1 cursor-pointer" onclick="toggleCard('${m.id}')">
                    <p class="text-[10px] text-orange-400 font-bold mb-1">● ${m.status}</p>
                    <div class="comment-area">
                        <p class="text-[11px] text-slate-500 leading-relaxed">${m.comment || 'よろしくお願いします！'}</p>
                    </div>
                </div>

                <div class="mt-3 flex justify-between items-center border-t border-slate-50 pt-3">
                    <a href="https://twitter.com/${m.id}" target="_blank" class="text-sky-500 text-[10px] font-bold flex items-center">
                        <svg class="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        @${m.id}
                    </a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- 制御系 ---
function toggleCard(id) { document.getElementById(`card-${id}`).classList.toggle('card-open'); }

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    index === -1 ? favorites.push(id) : favorites.splice(index, 1);
    localStorage.setItem('fav_members', JSON.stringify(favorites));
    renderMembers(allMembers);
}

function toggleFavFilter() {
    isFavFilterActive = !isFavFilterActive;
    const btn = document.getElementById('filter-fav');
    btn.classList.toggle('text-rose-500', isFavFilterActive);
    btn.classList.toggle('border-rose-100', isFavFilterActive);
    document.getElementById('fav-filter-icon').innerText = isFavFilterActive ? "❤️" : "🤍";
    renderMembers(allMembers);
}

function togglePart(btn) { btn.classList.toggle('active'); updatePreview(); }

function openEditModal() {
    if (isMenuOpen) toggleMenu();
    document.getElementById('fab-group').classList.add('hidden');
    document.getElementById('refresh-btn').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('hidden');
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

async function handleFinalize() {
    const btn = document.getElementById('btn-finalize');
    const selectedParts = Array.from(document.querySelectorAll('.part-chip.active')).map(c => c.dataset.value).join('/');
    const payload = {
        name: document.getElementById('edit-name').value,
        grade: document.getElementById('edit-grade').value,
        part: selectedParts,
        status: document.getElementById('edit-status').value,
        comment: document.getElementById('edit-comment').value,
        id: document.getElementById('edit-auth-id').value,
        pass: document.getElementById('edit-pass').value
    };

    if (!payload.name || !payload.id || payload.pass.length !== 4) return alert("入力内容を確認してください(PWは4桁)");

    btn.disabled = true;
    btn.innerText = "送信中...";
    try {
        const resp = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const res = await resp.json();
        alert(res.message);
        if (res.success) { closeEditModal(); fetchMembers(); }
    } catch (e) { alert("失敗"); }
    btn.disabled = false;
    btn.innerText = "確定";
}

function updatePreview() {
    const name = document.getElementById('edit-name').value || "名前";
    const id = document.getElementById('edit-auth-id').value;
    const preview = document.getElementById('edit-preview-card');
    preview.innerHTML = `<div class="flex items-center space-x-2 p-1 opacity-50 scale-90"><img src="https://unavatar.io/twitter/${id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(name)}" class="w-7 h-7 rounded-full"><span class="text-[10px] font-bold">@${id}</span></div>`;
}

// --- FAB ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const fab = document.getElementById('fab-main');
    const container = document.getElementById('btn-login-container');
    const overlay = document.getElementById('menu-overlay');
    if (isMenuOpen) {
        overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.add('opacity-100'), 10);
        fab.style.transform = "rotate(135deg)"; container.classList.add('fab-child-show');
    } else {
        overlay.classList.remove('opacity-100'); setTimeout(() => overlay.classList.add('hidden'), 300);
        fab.style.transform = "rotate(0deg)"; container.classList.remove('fab-child-show');
    }
}

document.getElementById('fab-main').addEventListener('click', toggleMenu);
document.getElementById('btn-login-open').addEventListener('click', openEditModal);
document.getElementById('refresh-btn').addEventListener('click', fetchMembers);
document.querySelectorAll('#edit-modal input, #edit-modal select, #edit-modal textarea').forEach(el => el.addEventListener('input', updatePreview));

fetchMembers();