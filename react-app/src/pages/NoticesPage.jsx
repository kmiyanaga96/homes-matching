import { useState, useEffect } from 'react';
import { API } from '../lib/api';

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    setLoading(true);
    try {
      const data = await API.getNotices();
      setNotices(data);
    } catch (e) {
      console.error('[fetchNotices]', e);
    }
    setLoading(false);
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">お知らせ</h2>

      {loading ? (
        <div className="text-center py-8 text-slate-500">読み込み中...</div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500">お知らせはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-2xl shadow p-4 ${
                notice.isImportant ? 'border-2 border-rose-200' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-slate-800">{notice.title}</h3>
                {notice.isImportant && (
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                    重要
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {notice.body}
              </p>
              {notice.createdAt && (
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(notice.createdAt).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
