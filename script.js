const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";
let allMembers = [];
let favorites = JSON.parse(localStorage.getItem('homes_favs')) || [];
let showOnlyFavs = false;

const PART_COLORS = { "Vo": "text-pink-400", "Gt": "text-sky-400", "Ba": "text-indigo-400", "Dr": "text-emerald-400", "Key": "text-amber-400" };

function getPartHTML(partStr) {
    return (partStr || "").split(/[/／、, ]/).map(p => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const colorClass = PART_COLORS[trimmed] || "text-[#65a30d]";
        return `<span class="${colorClass}">${trimmed}</span>`;
    }).filter(h => h).join('<span class="text-slate-300 mx-0.5">/</span>');
}

async function fetchMembers() {
    const loader = document.getElementById('loading');
    loader.classList.remove('fade-out'); // 再読み込み時に備えて
    
    try {
        const response = await fetch(API_URL);
        allMembers = await response.json();
        updateList(); 
        
        // ふわっと消す
        loader.classList.add('fade-out');
    } catch (error) {
        loader.innerHTML = `
            <div class="text-center p-6">
                <p class="text-gray-400 font-bold">データを読み込めませんでした</p>
                <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-[#d9f99d] text-slate-700 rounded-full text-xs font-bold shadow-sm">再試行</button>
            </div>`;
    }
}

function toggleFavorite(event, id) {
    if (event) event.stopPropagation();
    const index = favorites.indexOf(id);
    if (index > -1) favorites.splice(index, 1);
    else favorites.push(id);
    localStorage.setItem('homes_favs', JSON.stringify(favorites));
    updateList();
}

function updateList() {
    const nameQuery = (document.getElementById('search-name').value || "").toLowerCase();
    const gradeQuery = document.getElementById('filter-grade').value;
    const partQuery = document.getElementById('filter-part').value;
    const statusQuery = document.getElementById('filter-status').value;

    const filtered = allMembers.filter(m => {
        const isFav = favorites.includes(m.id);
        const matchFav = !showOnlyFavs || isFav;
        const matchName = (m.name || "").toLowerCase().includes(nameQuery) || (m.comment || "").toLowerCase().includes(nameQuery);
        const matchGrade = gradeQuery === "" || String(m.grade) === gradeQuery;
        const matchPart = partQuery === "" || (m.part || "").includes(partQuery);
        const matchStatus = statusQuery === "" || (m.status || "").includes(statusQuery);
        return matchFav && matchName && matchGrade && matchPart && matchStatus;
    });
    renderMembers(filtered);
}

function renderMembers(members) {
    const listContainer = document.getElementById('member-list');
    listContainer.innerHTML = members.length === 0 ? `<p class="text-center text-gray-400 py-10 text-sm">該当するメンバーがいません</p>` : "";

    members.forEach((m, index) => {
        const isFav = favorites.includes(m.id);
        const cardBg = m.grade === "卒業生" ? "bg-slate-100" : "bg-white";
        const iconUrl = m.id ? `https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=cbd5e1` 
                             : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=cbd5e1`;

        const card = document.createElement('div');
        card.className = `${cardBg} rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-5 flex items-center space-x-4 relative cursor-pointer hover:border-[#d9f99d] border border-transparent transition-all animate-fadeIn`;
        card.style.animationDelay = `${index * 0.03}s`;
        card.onclick = () => openModal(encodeURIComponent(JSON.stringify(m)));
        
        card.innerHTML = `
            <div class="relative flex-shrink-0">
                <img src="${iconUrl}" class="w-16 h-16 rounded-full bg-slate-100 object-cover border-2 border-white">
                ${(m.status !== 'むり') ? '<span class="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-lime-500 border-2 border-white"></span>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h2 class="font-bold text-slate-700 truncate text-base">${m.name}</h2>
                    <button onclick="toggleFavorite(event, '${m.id}')" class="p-1 focus:outline-none transition-transform active:scale-125">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isFav ? 'fill-red-500 text-red-500 heart-pop' : 'text-gray-300'}" fill="${isFav ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center space-x-2 mt-0.5">
                    <div class="text-[13px] font-bold flex items-center flex-wrap">${getPartHTML(m.part)}</div>
                    <span class="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">${m.grade}${isNaN(m.grade) ? '' : '年'}</span>
                </div>
                <p class="text-[10px] font-bold text-orange-400 uppercase tracking-tighter mt-1">${m.status}</p>
                <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${m.comment || ''}</p>
                <div class="mt-3 flex justify-end">
                    <div class="text-[9px] font-extrabold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">
                    X Profile / Details
                    </div>
                </div>
            </div>`;
        listContainer.appendChild(card);
    });
}

// イベント設定
document.getElementById('search-name').addEventListener('input', (e) => {
    document.getElementById('clear-btn').classList.toggle('hidden', e.target.value.length === 0);
    updateList();
});
document.getElementById('clear-btn').addEventListener('click', () => {
    const input = document.getElementById('search-name');
    input.value = '';
    document.getElementById('clear-btn').classList.add('hidden');
    updateList();
    input.focus();
});
document.getElementById('filter-grade').addEventListener('change', updateList);
document.getElementById('filter-part').addEventListener('change', updateList);
document.getElementById('filter-status').addEventListener('change', updateList);
document.getElementById('filter-fav').addEventListener('click', function() {
    showOnlyFavs = !showOnlyFavs;
    this.classList.toggle('bg-red-50'); this.classList.toggle('text-red-500'); this.classList.toggle('border-red-200');
    updateList();
});

// モーダル
function openModal(memberJson) {
    const m = JSON.parse(decodeURIComponent(memberJson));
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const iconUrl = m.id ? `https://unavatar.io/twitter/${m.id}` : `https://ui-avatars.com/api/?name=${m.name}`;

    content.innerHTML = `
        <div class="p-8 text-center">
            <img src="${iconUrl}" class="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg mb-4">
            <h2 class="text-2xl font-bold text-slate-700 mb-1">${m.name}</h2>
            <div class="flex items-center justify-center space-x-2 mb-4">
                <div class="font-bold text-sm">${getPartHTML(m.part)}</div>
                <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">${m.grade}${isNaN(m.grade) ? '' : '年'}</span>
            </div>
            <div class="bg-slate-50 rounded-2xl p-6 text-left mb-6">
                <p class="text-[10px] font-bold text-orange-400 uppercase mb-2">STATUS: ${m.status}</p>
                <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">${m.comment || '（コメントなし）'}</p>
            </div>
            <div class="flex flex-col space-y-3">
                ${m.id ? `<a href="https://twitter.com/${m.id}" target="_blank" class="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm">X (Twitter) を見る</a>` 
                      : `<div class="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold text-sm text-center italic">X ID未登録</div>`}
                <button onclick="closeModal()" class="w-full py-4 text-slate-400 font-bold text-sm">とじる</button>
            </div>
        </div>`;
    modal.classList.remove('hidden');
    setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
}

function closeModal() {
    const content = document.getElementById('modal-content');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { document.getElementById('detail-modal').classList.add('hidden'); }, 200);
}

document.getElementById('detail-modal').addEventListener('click', (e) => { if (e.target.id === 'detail-modal') closeModal(); });

// スクロール系ボタン
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    } else {
        backToTopBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }
});
backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

// ★リロードボタンの動作
document.getElementById('refresh-btn').addEventListener('click', () => {
    fetchMembers();
});

// 初期起動
fetchMembers();