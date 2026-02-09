import { useState, useEffect } from 'react';
import { API } from '../lib/api';

/**
 * AvailabilityForm — バンドメンバーがイベントの利用可能なスロットを選択
 * Props:
 *   - eventId: イベントID
 *   - bandId: バンドID
 *   - eventDate: イベント日付(ISO文字列)
 *   - windowDays: スロット生成ウィンドウ (デフォルト14日)
 *   - onSubmit: (availabilities) => Promise
 *   - onClose: () => void
 */
export default function AvailabilityForm({ eventId, bandId, eventDate, windowDays = 14, onSubmit, onClose }) {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // スロット生成
  useEffect(() => {
    const ev = new Date(eventDate);
    const slotsArr = [];

    // イベント日を除く前14日のスロット (12:00～22:00)
    for (let d = windowDays; d >= 1; d--) {
      const day = new Date(ev);
      day.setDate(ev.getDate() - d);
      const dayStr = day.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });

      for (let h = 12; h <= 22; h++) {
        const s = new Date(day);
        s.setHours(h, 0, 0, 0);
        const timeStr = `${String(h).padStart(2, '0')}:00`;
        slotsArr.push({
          index: slotsArr.length,
          iso: s.toISOString(),
          dayStr,
          timeStr,
          displayLabel: `${dayStr} ${timeStr}`,
          day: dayStr
        });
      }
    }

    setSlots(slotsArr);
  }, [eventDate, windowDays]);

  // サーバーから既存の可用性を取得
  useEffect(() => {
    fetchExistingAvailabilities();
  }, [eventId, bandId]);

  async function fetchExistingAvailabilities() {
    try {
      setLoading(true);
      // API endpoint を想定: GET /api/events/{eventId}/bands/{bandId}/availabilities
      const data = await API.getAvailabilities?.(eventId, bandId) || {};
      setSelected(data);
    } catch (e) {
      console.error('[fetchExistingAvailabilities]', e);
    } finally {
      setLoading(false);
    }
  }

  function toggleSlot(index) {
    setSelected(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }

  async function handleSubmit() {
    if (Object.values(selected).filter(Boolean).length === 0) {
      setError('最低1つ以上のスロットを選択してください');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(selected);
      onClose();
    } catch (e) {
      console.error('[handleSubmit]', e);
      setError(e.message || '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  // 日付ごとにグループ化
  const groupedByDay = {};
  slots.forEach(s => {
    if (!groupedByDay[s.day]) groupedByDay[s.day] = [];
    groupedByDay[s.day].push(s);
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
        <div className="p-4 sticky top-0 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">利用可能なスロット選択</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">イベント日を除く14日間のスロットから選択 (全{slots.length}スロット)</p>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <p className="text-center text-slate-500 py-8">読み込み中...</p>
          ) : (
            <>
              {/* スロット選択グリッド */}
              <div className="space-y-4">
                {Object.entries(groupedByDay).map(([dayLabel, daySlotsArr]) => (
                  <div key={dayLabel}>
                    <h3 className="text-sm font-bold text-slate-700 mb-2">{dayLabel}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlotsArr.map(s => (
                        <button
                          key={s.index}
                          onClick={() => toggleSlot(s.index)}
                          className={`py-2 px-2 rounded-lg border-2 font-bold text-sm transition ${
                            selected[s.index]
                              ? 'border-lime-500 bg-lime-50 text-lime-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {s.timeStr}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* サマリー */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 font-bold">
                  選択済みスロット: {selectedCount}個 / {slots.length}個
                </p>
              </div>

              {/* ボタン */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedCount === 0}
                  className="flex-1 py-2 bg-lime-500 text-white rounded-lg font-bold text-sm hover:bg-lime-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
