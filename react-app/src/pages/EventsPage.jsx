import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { EVENT_TYPES } from '../lib/constants';

export default function EventsPage() {
  const { isLoggedIn, auth, checkPermission } = useAuth();
  const canEdit = checkPermission('eventEdit');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const data = await API.getEvents();
      // 直近順（未来のイベントが上、過去は下）
      const now = new Date().toISOString();
      data.sort((a, b) => {
        const aFuture = a.date >= now;
        const bFuture = b.date >= now;
        if (aFuture && !bFuture) return -1;
        if (!aFuture && bFuture) return 1;
        if (aFuture) return a.date.localeCompare(b.date);
        return b.date.localeCompare(a.date);
      });
      setEvents(data);
    } catch (e) {
      console.error('[fetchEvents]', e);
    }
    setLoading(false);
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">イベント</h2>
        {canEdit && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-1.5 bg-lime-500 text-white rounded-lg font-bold text-sm"
          >
            + 作成
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">読み込み中...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500">イベントがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <EventCard key={ev.id} event={ev} onTap={() => setSelectedEvent(ev)} />
          ))}
        </div>
      )}

      {showCreate && (
        <EventCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchEvents(); }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={fetchEvents}
        />
      )}
    </div>
  );
}

/* ========== イベントカード ========== */
function EventCard({ event, onTap }) {
  const isLive = event.type === 'live';
  const isPast = new Date(event.date) < new Date();
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
  }) : '';

  return (
    <button
      onClick={onTap}
      className={`w-full bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition ${isPast ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isLive ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
            }`}>
              {EVENT_TYPES[event.type] || event.type}
            </span>
            {isPast && <span className="text-[10px] text-slate-400">終了</span>}
          </div>
          <h3 className="font-bold text-slate-800">{event.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr}</p>
          {event.location && (
            <p className="text-[11px] text-slate-400 mt-0.5">{event.location}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ========== イベント作成モーダル ========== */
function EventCreateModal({ onClose, onCreated }) {
  const { auth } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('live');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [entryStart, setEntryStart] = useState('');
  const [entryEnd, setEntryEnd] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !date) {
      alert('イベント名と日程は必須です');
      return;
    }
    setSaving(true);
    try {
      const result = await API.createEvent({
        name: name.trim(),
        type,
        date,
        location: location.trim(),
        entryStart: entryStart || null,
        entryEnd: entryEnd || null,
        createdBy: auth.id,
      });
      if (result.success) {
        alert('イベントを作成しました');
        onCreated();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[createEvent]', e);
      alert('失敗');
    }
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">イベント作成</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">イベント名 *</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">タイプ *</span>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="live">ライブ</option>
                <option value="other">その他</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">日程 *</span>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">場所</span>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">エントリー開始</span>
              <input type="datetime-local" value={entryStart} onChange={e => setEntryStart(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-bold text-slate-700">エントリー終了</span>
              <input type="datetime-local" value={entryEnd} onChange={e => setEntryEnd(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <button type="submit" disabled={saving}
              className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50">
              {saving ? '作成中...' : '作成'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ========== イベント詳細モーダル ========== */
function EventDetailModal({ event, onClose, onUpdated }) {
  const { isLoggedIn, auth, checkPermission } = useAuth();
  const canEdit = checkPermission('eventEdit');
  const isLive = event.type === 'live';
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);

  useEffect(() => { fetchEntries(); }, [event.id]);

  async function fetchEntries() {
    setLoadingEntries(true);
    try {
      const data = await API.getEntriesByEvent(event.id);
      setEntries(data);
    } catch (e) {
      console.error('[fetchEntries]', e);
    }
    setLoadingEntries(false);
  }

  const dateStr = event.date ? new Date(event.date).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  const entryStartStr = event.entryStart ? new Date(event.entryStart).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : null;
  const entryEndStr = event.entryEnd ? new Date(event.entryEnd).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : null;

  // エントリー期間中かどうか
  const now = new Date().toISOString();
  const isEntryOpen = event.entryStart && event.entryEnd &&
    now >= event.entryStart && now <= event.entryEnd;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isLive ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
              }`}>
                {EVENT_TYPES[event.type] || event.type}
              </span>
              <h2 className="text-lg font-bold text-slate-800">{event.name}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            <InfoRow label="日程" value={dateStr} />
            {event.location && <InfoRow label="場所" value={event.location} />}
            {entryStartStr && entryEndStr && (
              <InfoRow label="エントリー期間" value={`${entryStartStr} ~ ${entryEndStr}`} />
            )}
            {isEntryOpen && (
              <span className="inline-block text-[10px] px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full font-bold">
                エントリー受付中
              </span>
            )}
          </div>

          {/* YouTube Link */}
          {isLive && event.youtubeUrl && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-1">ライブ動画</h3>
              <a href={event.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline break-all">
                {event.youtubeUrl}
              </a>
            </div>
          )}

          {/* Entries */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700">
                エントリー ({entries.length}件)
              </h3>
            </div>

            {loadingEntries ? (
              <p className="text-xs text-slate-500">読み込み中...</p>
            ) : entries.length === 0 ? (
              <p className="text-xs text-slate-500">エントリーがありません</p>
            ) : (
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="bg-slate-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        {entry.type === 'band' ? entry.bandName : entry.memberName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        entry.status === 'selected' ? 'bg-lime-100 text-lime-700' :
                        entry.status === 'rejected' ? 'bg-rose-100 text-rose-500' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {entry.status === 'selected' ? '当選' :
                         entry.status === 'rejected' ? '落選' : 'エントリー済'}
                      </span>
                    </div>
                    {entry.songs && entry.songs.length > 0 && (
                      <div className="mt-1">
                        {entry.songs.map((s, i) => (
                          <p key={i} className="text-[11px] text-slate-500">
                            {s.order}. {s.title} / {s.artist}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Entry button */}
            {isLoggedIn && isEntryOpen && (
              <button
                onClick={() => setShowEntryForm(true)}
                className="w-full mt-3 py-2 bg-lime-500 text-white rounded-xl font-bold text-sm"
              >
                {isLive ? 'バンドでエントリー' : '個人でエントリー'}
              </button>
            )}
          </div>

          {showEntryForm && (
            <EntryForm
              event={event}
              onClose={() => setShowEntryForm(false)}
              onCreated={() => { setShowEntryForm(false); fetchEntries(); }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <span className="text-xs text-slate-800">{value}</span>
    </div>
  );
}

/* ========== エントリーフォーム ========== */
function EntryForm({ event, onClose, onCreated }) {
  const { auth } = useAuth();
  const isLive = event.type === 'live';
  const [bands, setBands] = useState([]);
  const [selectedBandId, setSelectedBandId] = useState('');
  const [songs, setSongs] = useState([{ order: 1, title: '', artist: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLive) fetchMyBands();
  }, []);

  async function fetchMyBands() {
    try {
      const allBands = await API.getBands();
      const myBands = allBands.filter(b =>
        b.status === 'closed' &&
        (b.members || []).some(m => m.id === auth.id)
      );
      setBands(myBands);
      if (myBands.length > 0) setSelectedBandId(myBands[0].id);
    } catch (e) {
      console.error('[fetchMyBands]', e);
    }
  }

  function addSong() {
    setSongs(prev => [...prev, { order: prev.length + 1, title: '', artist: '' }]);
  }

  function updateSong(index, field, value) {
    setSongs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function removeSong(index) {
    setSongs(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  async function handleSubmit() {
    if (isLive && !selectedBandId) {
      alert('エントリーするバンドを選択してください');
      return;
    }
    setSaving(true);
    try {
      const selectedBand = bands.find(b => b.id === selectedBandId);
      const member = await API.getMember(auth.id);

      const result = await API.createEntry({
        eventId: event.id,
        type: isLive ? 'band' : 'individual',
        bandId: isLive ? selectedBandId : null,
        bandName: isLive ? selectedBand?.name : "",
        memberId: auth.id,
        memberName: member?.name || auth.id,
        songs: isLive ? songs.filter(s => s.title.trim()) : [],
      });
      if (result.success) {
        alert('エントリーしました');
        onCreated();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[createEntry]', e);
      alert('失敗');
    }
    setSaving(false);
  }

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700">エントリーフォーム</h3>
        <button onClick={onClose} className="text-xs text-slate-500 hover:underline">閉じる</button>
      </div>

      {isLive ? (
        <>
          <label className="block mb-3">
            <span className="text-xs font-bold text-slate-600">バンド（〆状態のもの）</span>
            {bands.length === 0 ? (
              <p className="text-xs text-slate-500 mt-1">〆状態のバンドがありません</p>
            ) : (
              <select value={selectedBandId} onChange={e => setSelectedBandId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {bands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </label>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-600">演奏曲</span>
              <button onClick={addSong} className="text-[10px] text-lime-600 font-bold">+ 追加</button>
            </div>
            {songs.map((song, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs text-slate-500 mt-2 w-4">{song.order}.</span>
                <input type="text" value={song.title} onChange={e => updateSong(i, 'title', e.target.value)}
                  placeholder="曲名" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                <input type="text" value={song.artist} onChange={e => updateSong(i, 'artist', e.target.value)}
                  placeholder="アーティスト" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                {songs.length > 1 && (
                  <button onClick={() => removeSong(i)} className="text-rose-400 text-xs">×</button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500 mb-3">個人エントリーです</p>
      )}

      <button onClick={handleSubmit} disabled={saving || (isLive && bands.length === 0)}
        className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold text-sm disabled:opacity-50">
        {saving ? 'エントリー中...' : 'エントリーする'}
      </button>
    </div>
  );
}
