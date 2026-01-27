import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { ROLES, ROLE_KEYS, GROUPS, PARTS, EVENT_TYPES } from '../lib/constants';

const ADMIN_TABS = [
  { key: 'notices', label: 'お知らせ管理' },
  { key: 'members', label: 'メンバー一覧' },
  { key: 'roles', label: '役職付与' },
  { key: 'events', label: 'イベント管理' },
];

export default function AdminPage() {
  const { checkAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('notices');

  if (!checkAdmin()) {
    return (
      <div className="py-8 text-center text-slate-500">
        管理者のみアクセスできます
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">管理画面</h2>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow'
                : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'notices' && <NoticesSection />}
      {activeTab === 'members' && <MembersSection />}
      {activeTab === 'roles' && <RolesSection />}
      {activeTab === 'events' && <EventsAdminSection />}
    </div>
  );
}

/* ========== お知らせ管理 ========== */
function NoticesSection() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => { fetchNotices(); }, []);

  async function fetchNotices() {
    setLoading(true);
    try {
      const data = await API.getNoticesAdmin();
      setNotices(data);
    } catch (e) {
      console.error('[fetchNotices]', e);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('タイトルと本文は必須です');
      return;
    }
    try {
      const result = await API.createNotice({
        title: title.trim(),
        body: body.trim(),
        isActive,
        isImportant
      });
      if (result.success) {
        alert('投稿しました');
        setTitle('');
        setBody('');
        setIsActive(true);
        setIsImportant(false);
        fetchNotices();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[createNotice]', e);
      alert('失敗');
    }
  }

  async function toggleActive(notice) {
    try {
      const result = await API.updateNotice(notice.id, { isActive: !notice.isActive });
      if (result.success) fetchNotices();
    } catch (e) { console.error('[toggleActive]', e); }
  }

  async function toggleImportant(notice) {
    try {
      const result = await API.updateNotice(notice.id, { isImportant: !notice.isImportant });
      if (result.success) fetchNotices();
    } catch (e) { console.error('[toggleImportant]', e); }
  }

  async function handleDelete(notice) {
    if (!confirm('このお知らせを削除しますか？')) return;
    try {
      const result = await API.deleteNotice(notice.id);
      if (result.success) fetchNotices();
    } catch (e) { console.error('[deleteNotice]', e); }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h3 className="font-bold text-slate-700 mb-3">新規お知らせ</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タイトル"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="本文"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 resize-none mb-3"
          />
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              公開
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} />
              重要
            </label>
          </div>
          <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold">
            投稿
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700">一覧</h3>
        <button onClick={fetchNotices} className="text-xs text-slate-500 hover:underline">更新</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">読み込み中...</div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500">お知らせがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl shadow p-3 ${
                notice.isImportant ? 'border-2 border-rose-200' : ''
              } ${!notice.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{notice.title}</h4>
                    {notice.isImportant && <span className="text-[10px] font-bold text-rose-500">重要</span>}
                    {!notice.isActive && <span className="text-[10px] font-bold text-slate-500">非公開</span>}
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-2">{notice.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {notice.createdAt && new Date(notice.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => toggleActive(notice)} className="text-[10px] px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">
                    {notice.isActive ? '非公開に' : '公開に'}
                  </button>
                  <button onClick={() => toggleImportant(notice)} className="text-[10px] px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">
                    {notice.isImportant ? '重要OFF' : '重要ON'}
                  </button>
                  <button onClick={() => handleDelete(notice)} className="text-[10px] px-2 py-1 text-rose-500 hover:underline">
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ========== メンバー一覧 ========== */
function MembersSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const data = await API.getAllMembers();
      data.sort((a, b) => a.id.localeCompare(b.id));
      setMembers(data);
    } catch (e) {
      console.error('[fetchMembers]', e);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">読み込み中...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700">全メンバー ({members.length}人)</h3>
        <button onClick={fetchMembers} className="text-xs text-slate-500 hover:underline">更新</button>
      </div>
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-800">{m.name || m.id}</span>
                <span className="text-xs text-slate-500 ml-2">@{m.id}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.part && <span className="text-[10px] px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full">{m.part}</span>}
                {m.grade && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{m.grade}年</span>}
              </div>
            </div>
            {m.roles && m.roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {m.roles.map(role => (
                  <span key={role} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    {ROLES[role] || role}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ========== 役職付与 ========== */
function RolesSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const data = await API.getAllMembers();
      data.sort((a, b) => a.id.localeCompare(b.id));
      setMembers(data);
    } catch (e) {
      console.error('[fetchMembers]', e);
    }
    setLoading(false);
  }

  function selectMember(member) {
    setSelectedMember(member);
    setSelectedRoles([...(member.roles || [])]);
  }

  function toggleRole(roleKey) {
    setSelectedRoles(prev =>
      prev.includes(roleKey)
        ? prev.filter(r => r !== roleKey)
        : [...prev, roleKey]
    );
  }

  async function handleSave() {
    if (!selectedMember) return;
    setSaving(true);
    try {
      const result = await API.updateMemberRoles(selectedMember.id, selectedRoles);
      if (result.success) {
        alert(`${selectedMember.name || selectedMember.id} の役職を更新しました`);
        setSelectedMember(null);
        setSelectedRoles([]);
        fetchMembers();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[updateRoles]', e);
      alert('失敗');
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">読み込み中...</div>;
  }

  return (
    <>
      {!selectedMember ? (
        <>
          <h3 className="font-bold text-slate-700 mb-3">メンバーを選択</h3>
          <div className="space-y-2">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => selectMember(m)}
                className="w-full bg-white rounded-xl shadow p-3 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-800">{m.name || m.id}</span>
                    <span className="text-xs text-slate-500 ml-2">@{m.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(m.roles || []).map(role => (
                      <span key={role} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                        {ROLES[role] || role}
                      </span>
                    ))}
                    {(!m.roles || m.roles.length === 0) && (
                      <span className="text-[10px] text-slate-400">役職なし</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">
              {selectedMember.name || selectedMember.id} の役職
            </h3>
            <button
              onClick={() => { setSelectedMember(null); setSelectedRoles([]); }}
              className="text-xs text-slate-500 hover:underline"
            >
              戻る
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {ROLE_KEYS.map(roleKey => (
              <label
                key={roleKey}
                className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                  selectedRoles.includes(roleKey)
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(roleKey)}
                  onChange={() => toggleRole(roleKey)}
                  className="accent-amber-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800">{ROLES[roleKey]}</span>
                  {roleKey === 'groupLeader' && (
                    <span className="text-[10px] text-slate-500 ml-2">({GROUPS.join(' / ')})</span>
                  )}
                  {roleKey === 'partLeader' && (
                    <span className="text-[10px] text-slate-500 ml-2">({PARTS.join(' / ')})</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
    </>
  );
}

/* ========== イベント管理 ========== */
function EventsAdminSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const data = await API.getEvents();
      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setEvents(data);
    } catch (e) {
      console.error('[fetchEvents]', e);
    }
    setLoading(false);
  }

  async function handleDelete(ev) {
    if (!confirm(`「${ev.name}」を削除しますか？`)) return;
    try {
      const result = await API.deleteEvent(ev.id);
      if (result.success) fetchEvents();
    } catch (e) {
      console.error('[deleteEvent]', e);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">読み込み中...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700">全イベント ({events.length}件)</h3>
        <button onClick={fetchEvents} className="text-xs text-slate-500 hover:underline">更新</button>
      </div>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500">イベントがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'short', day: 'numeric'
            }) : '';
            return (
              <div key={ev.id} className="bg-white rounded-xl shadow p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        ev.type === 'live' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
                      }`}>
                        {EVENT_TYPES[ev.type] || ev.type}
                      </span>
                      <span className="font-bold text-sm text-slate-800">{ev.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{dateStr} {ev.location && `| ${ev.location}`}</p>
                  </div>
                  <button onClick={() => handleDelete(ev)}
                    className="text-[10px] px-2 py-1 text-rose-500 hover:underline shrink-0">
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
