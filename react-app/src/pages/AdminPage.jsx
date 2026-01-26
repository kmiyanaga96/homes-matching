import { useState, useEffect } from 'react';
import { API } from '../lib/api';

export default function AdminPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

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
      const result = await API.updateNotice(notice.id, {
        isActive: !notice.isActive
      });
      if (result.success) {
        fetchNotices();
      }
    } catch (e) {
      console.error('[toggleActive]', e);
    }
  }

  async function toggleImportant(notice) {
    try {
      const result = await API.updateNotice(notice.id, {
        isImportant: !notice.isImportant
      });
      if (result.success) {
        fetchNotices();
      }
    } catch (e) {
      console.error('[toggleImportant]', e);
    }
  }

  async function handleDelete(notice) {
    if (!confirm('このお知らせを削除しますか？')) return;

    try {
      const result = await API.deleteNotice(notice.id);
      if (result.success) {
        fetchNotices();
      }
    } catch (e) {
      console.error('[deleteNotice]', e);
    }
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-slate-800 mb-4">管理画面</h2>

      {/* Create Form */}
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
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              公開
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
              />
              重要
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold"
          >
            投稿
          </button>
        </form>
      </div>

      {/* Notice List */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-700">一覧</h3>
        <button
          onClick={fetchNotices}
          className="text-xs text-slate-500 hover:underline"
        >
          更新
        </button>
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
                    <h4 className="font-bold text-sm text-slate-800 truncate">
                      {notice.title}
                    </h4>
                    {notice.isImportant && (
                      <span className="text-[10px] font-bold text-rose-500">重要</span>
                    )}
                    {!notice.isActive && (
                      <span className="text-[10px] font-bold text-slate-500">非公開</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-2">
                    {notice.body}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {notice.createdAt && new Date(notice.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(notice)}
                    className="text-[10px] px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    {notice.isActive ? '非公開に' : '公開に'}
                  </button>
                  <button
                    onClick={() => toggleImportant(notice)}
                    className="text-[10px] px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    {notice.isImportant ? '重要OFF' : '重要ON'}
                  </button>
                  <button
                    onClick={() => handleDelete(notice)}
                    className="text-[10px] px-2 py-1 text-rose-500 hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
