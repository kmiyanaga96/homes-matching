const API_URL = "https://script.google.com/macros/s/AKfycbz8uRbvgYokCEfeK5LajVDBuSNn6ZnfmL1ZuCaF44nTmQ7PfL4OFVdecrdTRwXO6_8Y/exec";
let allMembers = [];
let isMenuOpen = false;

// --- 1. データの取得 ---
async function fetchMembers() {
    const loader = document.getElementById('loading');
    if (loader) loader.classList.remove('hidden');
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allMembers = Array.isArray(data) ? data : [];
        renderMembers(allMembers);
    } catch (e) {
        console.error("データ取得エラー:", e);
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// --- 2. データの描画（日本語キー対応） ---
function renderMembers(members) {
    const container = document.getElementById('member-list');
    if (!container) return;
    
    container.innerHTML = members.length === 0 ? '<p class="text-center text-slate-400 py-10">データがありません</p>' : "";
    
    members.forEach((m, i) => {
        const name = m["名前"] || "名前未設定";
        const part = m["パート"] || "担当なし";
        const grade = m["学年"] || "-";
        const status = m["いつ組む？"] || "未設定";
        const id = m["id"] || "";

        const cardHTML = `
            <div class="bg-white rounded-3xl shadow-sm p-5 flex items-center space-x-4 animate-fadeIn" style="animation-delay: ${i*0.03}s">
                <img src="https://unavatar.io/twitter/${id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(name)}" 
                     class="w-14 h-14 rounded-full bg-slate-100 object-cover border border-slate-50">
                <div class="flex-1 min-w-0">
                    <h2 class="font-bold text-slate-700 truncate">${name}</h2>
                    <p class="text-[11px] text-[#65a30d] font-bold">${part} / ${grade}${isNaN(grade) ? '' : '年'}</p>
                    <p class="text-[10px] font-bold text-orange-400 mt-0.5">${status}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// --- 3. UI制御（メニュー・モーダル） ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const overlay = document.getElementById('menu-overlay');
    const fab = document.getElementById('fab-main');
    const container = document.getElementById('btn-login-container');
    
    if (isMenuOpen) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        fab.classList.add('active');
        container.classList.add('fab-child-show');
    } else {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
        fab.classList.remove('active');
        container.classList.remove('fab-child-show');
    }
}

function openEditModal() {
    if (isMenuOpen) toggleMenu();
    document.getElementById('fab-group').classList.add('fab-hidden');
    document.getElementById('refresh-btn').classList.add('fab-hidden');

    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('edit-content').classList.add('show');
        updatePreview();
    }, 10);
}

function closeEditModal() {
    document.getElementById('edit-content').classList.remove('show');
    setTimeout(() => {
        document.getElementById('edit-modal').classList.add('hidden');
        document.getElementById('fab-group').classList.remove('fab-hidden');
        document.getElementById('refresh-btn').classList.remove('fab-hidden');
    }, 300);
}

// --- 4. プレビュー更新 ---
function updatePreview() {
    const name = document.getElementById('edit-name').value || "お名前";
    const id = document.getElementById('edit-auth-id').value;
    const part = document.getElementById('edit-part').value || "パート";
    const grade = document.getElementById('edit-grade').value;

    const preview = document.getElementById('edit-preview-card');
    preview.innerHTML = `
        <div class="flex items-center space-x-3 p-2 scale-90 opacity-60">
            <img src="https://unavatar.io/twitter/${id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(name)}" class="w-10 h-10 rounded-full">
            <div>
                <p class="font-bold text-xs">${name}</p>
                <p class="text-[9px] text-lime-600">${part} / ${grade}年</p>
            </div>
        </div>`;
}

// --- 5. データの確定送信（日本語キーで送信） ---
async function handleFinalize() {
    const btn = document.getElementById('btn-finalize');
    const payload = {
        "名前": document.getElementById('edit-name').value,
        "学年": document.getElementById('edit-grade').value,
        "パート": document.getElementById('edit-part').value,
        "いつ組む？": document.getElementById('edit-status').value,
        "コメント": document.getElementById('edit-comment').value,
        "id": document.getElementById('edit-auth-id').value,
        "pass": document.getElementById('edit-pass').value
    };

    if (!payload["id"] || !payload["pass"]) return alert("IDとパスワードは必須です");

    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        const resp = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify(payload) 
        });
        const res = await resp.json();
        
        if (res.success) {
            alert(res.message);
            closeEditModal();
            fetchMembers(); // リロードして反映
        } else {
            alert("エラー: " + res.message);
        }
    } catch (e) {
        alert("サーバーとの通信に失敗しました");
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.innerText = "確定";
    }
}

// --- 6. イベントリスナー設定 ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fab-main').addEventListener('click', toggleMenu);
    document.getElementById('btn-login-open').addEventListener('click', openEditModal);
    document.getElementById('refresh-btn').addEventListener('click', fetchMembers);
    
    // プレビュー用の入力監視
    const inputs = ['edit-name', 'edit-grade', 'edit-part', 'edit-status', 'edit-comment', 'edit-auth-id'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePreview);
    });

    // 初回読み込み
    fetchMembers();
});