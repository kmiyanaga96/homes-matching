import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { STUDIO_LOCATIONS } from '../lib/constants';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function SchedulePage() {
  const { isLoggedIn, auth } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [events, setEvents] = useState([]);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showStudioCreate, setShowStudioCreate] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [evData, stData] = await Promise.all([
        API.getEvents(),
        API.getStudioSchedules(),
      ]);
      setEvents(evData);
      setStudios(stData);
    } catch (e) {
      console.error('[fetchData]', e);
    }
    setLoading(false);
  }

  const { year, month } = currentDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  // 月内のイベント・スタジオを日付ごとにグループ化
  const dayItems = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = [];

      events.forEach(ev => {
        if (ev.date && ev.date.startsWith(dateStr)) {
          items.push({ type: 'event', data: ev });
        }
      });

      studios.forEach(st => {
        if (st.date === dateStr) {
          items.push({ type: 'studio', data: st });
        }
      });

      if (items.length > 0) map[d] = items;
    }
    return map;
  }, [events, studios, year, month, daysInMonth]);

  function prevMonth() {
    setCurrentDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDay(null);
  }

  // 年度チェック（前年度まで閲覧可 = 4月始まり）
  const currentFiscalYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const targetFiscalYear = month >= 3 ? year : year - 1;
  const isTooOld = targetFiscalYear < currentFiscalYear - 1;

  const selectedDayItems = selectedDay ? (dayItems[selectedDay] || []) : [];

  return (
    <div className="py-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          {year}年 {month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {isTooOld ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500">この年度のデータはアーカイブ済みです</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-slate-500">読み込み中...</div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl shadow p-3 mb-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd, i) => (
                <div key={wd} className={`text-center text-[10px] font-bold py-1 ${
                  i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-400'
                }`}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before 1st */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-12" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayOfWeek = (firstDay + i) % 7;
                const items = dayItems[day];
                const hasEvent = items?.some(it => it.type === 'event');
                const hasStudio = items?.some(it => it.type === 'studio');
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-12 flex flex-col items-center justify-start pt-1 rounded-lg transition ${
                      isSelected ? 'bg-lime-100' :
                      isToday(day) ? 'bg-lime-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-bold ${
                      isToday(day) ? 'text-lime-700' :
                      dayOfWeek === 0 ? 'text-rose-400' :
                      dayOfWeek === 6 ? 'text-sky-400' : 'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      {hasStudio && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] text-slate-500">イベント</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-[10px] text-slate-500">スタジオ</span>
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          {selectedDay && (
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                {month + 1}月{selectedDay}日の予定
              </h3>
              {selectedDayItems.length === 0 ? (
                <p className="text-xs text-slate-500">予定はありません</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayItems.map((item, i) => (
                    <div key={i} className={`rounded-lg p-3 ${
                      item.type === 'event' ? 'bg-red-50' : 'bg-violet-50'
                    }`}>
                      {item.type === 'event' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
                              {item.data.type === 'live' ? 'ライブ' : 'その他'}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{item.data.name}</span>
                          </div>
                          {item.data.location && (
                            <p className="text-[11px] text-slate-500 mt-1">{item.data.location}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-bold">
                              スタジオ
                            </span>
                            <span className="text-sm font-bold text-slate-800">{item.data.bandName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {item.data.startTime} ~ {item.data.endTime} @ {item.data.location === 'その他' ? item.data.locationOther : item.data.location}
                          </p>
                          {item.data.members && item.data.members.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.data.members.map((m, j) => (
                                <span key={j} className="text-[10px] px-1.5 py-0.5 bg-white/80 rounded text-violet-700">
                                  {m.name || m.id}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Studio Schedule Button */}
          {isLoggedIn && (
            <button
              onClick={() => setShowStudioCreate(true)}
              className="w-full py-3 bg-violet-500 text-white rounded-2xl font-bold text-sm shadow"
            >
              + スタジオ練習を登録
            </button>
          )}

          {showStudioCreate && (
            <StudioCreateModal
              onClose={() => setShowStudioCreate(false)}
              onCreated={() => { setShowStudioCreate(false); fetchData(); }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ========== スタジオ練習登録モーダル ========== */
function StudioCreateModal({ onClose, onCreated }) {
  const { auth } = useAuth();
  const [bands, setBands] = useState([]);
  const [selectedBandId, setSelectedBandId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState(STUDIO_LOCATIONS[0]);
  const [locationOther, setLocationOther] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMyBands(); }, []);

  async function fetchMyBands() {
    try {
      const allBands = await API.getBands();
      const myBands = allBands.filter(b =>
        (b.members || []).some(m => m.id === auth.id)
      );
      setBands(myBands);
      if (myBands.length > 0) setSelectedBandId(myBands[0].id);
    } catch (e) {
      console.error('[fetchMyBands]', e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedBandId || !date || !startTime || !endTime) {
      alert('必須項目を入力してください');
      return;
    }
    setSaving(true);
    try {
      const band = bands.find(b => b.id === selectedBandId);
      const result = await API.createStudioSchedule({
        bandId: selectedBandId,
        bandName: band?.name || '',
        date,
        startTime,
        endTime,
        location: location,
        locationOther: location === 'その他' ? locationOther : '',
        members: band?.members || [],
        createdBy: auth.id,
      });
      if (result.success) {
        alert('スタジオ練習を登録しました');
        onCreated();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[createStudio]', e);
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
            <h2 className="text-lg font-bold text-slate-800">スタジオ練習登録</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">バンド *</span>
              {bands.length === 0 ? (
                <p className="text-xs text-slate-500 mt-1">参加中のバンドがありません</p>
              ) : (
                <select value={selectedBandId} onChange={e => setSelectedBandId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {bands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">日付 *</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>

            <div className="flex gap-2 mb-3">
              <label className="flex-1">
                <span className="text-sm font-bold text-slate-700">開始時刻 *</span>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </label>
              <label className="flex-1">
                <span className="text-sm font-bold text-slate-700">終了時刻 *</span>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </label>
            </div>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">場所 *</span>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {STUDIO_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="その他">その他</option>
              </select>
            </label>

            {location === 'その他' && (
              <label className="block mb-3">
                <span className="text-sm font-bold text-slate-700">その他の場所</span>
                <input type="text" value={locationOther} onChange={e => setLocationOther(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="場所名を入力" />
              </label>
            )}

            <button type="submit" disabled={saving || bands.length === 0}
              className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50">
              {saving ? '登録中...' : '登録'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
