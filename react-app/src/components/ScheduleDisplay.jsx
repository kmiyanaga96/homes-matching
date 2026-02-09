import { useState, useEffect } from 'react';
import { API } from '../lib/api';

/**
 * ScheduleDisplay — 最適化されたスケジュール結果を表示
 * Props:
 *   - eventId: イベントID
 *   - schools or studios: スタジオ情報
 *   - onClose: () => void
 */
export default function ScheduleDisplay({ eventId, studios = [], onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optimizationRun, setOptimizationRun] = useState(null);

  useEffect(() => {
    fetchScheduleResults();
  }, [eventId]);

  async function fetchScheduleResults() {
    try {
      setLoading(true);
      setError('');

      // スケジュール取得: API.getSchedulesByEvent(eventId)
      const schedData = await API.getSchedulesByEvent?.(eventId) || [];
      setSchedules(Array.isArray(schedData) ? schedData : []);

      // 最新の最適化実行情報取得（オプション）
      const runInfo = await API.getLatestOptimizationRun?.(eventId);
      if (runInfo) setOptimizationRun(runInfo);
    } catch (e) {
      console.error('[fetchScheduleResults]', e);
      setError(e.message || 'スケジュール取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  const studioMap = {};
  studios.forEach(s => { studioMap[s.id] = s; });

  // スケジュールをバンド＋スタジオでグループ化
  const schedulesByBandStudio = {};
  schedules.forEach(sched => {
    const key = `${sched.bandId}__${sched.studioId}`;
    if (!schedulesByBandStudio[key]) {
      schedulesByBandStudio[key] = [];
    }
    schedulesByBandStudio[key].push(sched);
  });

  // スケジュール件数の集計
  const bandCounts = {};
  schedules.forEach(sched => {
    bandCounts[sched.bandId] = (bandCounts[sched.bandId] || 0) + 1;
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
        <div className="p-4 sticky top-0 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">スケジュール結果</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">読み込み中...</div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-2">スケジュールがまだ生成されていません</p>
              <p className="text-xs text-slate-400">全バンドが可用性を提出すると自動的に最適化が実行されます</p>
            </div>
          ) : (
            <>
              {/* 最適化情報 */}
              {optimizationRun && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-blue-700">最適化実行情報</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      optimizationRun.status === 'success' ? 'bg-lime-100 text-lime-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {optimizationRun.status}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    {optimizationRun.assignments && (
                      <p>割り当て数: {optimizationRun.assignments}</p>
                    )}
                    {optimizationRun.timingSec && (
                      <p>計算時間: {optimizationRun.timingSec.toFixed(3)}秒</p>
                    )}
                    {optimizationRun.finishedAt && (
                      <p>実行時刻: {new Date(optimizationRun.finishedAt).toLocaleString('ja-JP')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* スケジュール一覧 */}
              <div className="space-y-3">
                {Object.entries(bandCounts).map(([bandId, count]) => (
                  <div key={bandId} className="border border-slate-200 rounded-lg p-3">
                    <h3 className="font-bold text-slate-800 mb-2">{bandId}</h3>
                    <div className="space-y-2">
                      {schedules.filter(s => s.bandId === bandId).map((sched, idx) => {
                        const studio = studioMap[sched.studioId];
                        const startIdx = sched.startIndex;
                        const endIdx = sched.endIndex;
                        const durationHours = endIdx - startIdx + 1;

                        return (
                          <div key={idx} className="bg-slate-50 p-2 rounded-lg text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700">
                                {studio ? studio.name : sched.studioId}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-bold">
                                {durationHours}時間
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              スロット #{startIdx} ～ #{endIdx}
                            </p>
                            {sched.autoOptimized && (
                              <p className="text-[11px] text-slate-400 mt-1">自動最適化による割り当て</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 合計 */}
              <div className="bg-lime-50 p-3 rounded-lg border border-lime-200">
                <p className="text-sm font-bold text-lime-700">
                  合計: {schedules.length}件のスロット割り当て
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
