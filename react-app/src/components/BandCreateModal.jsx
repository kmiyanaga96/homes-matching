import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { PARTS } from '../lib/constants';

export default function BandCreateModal({ onClose, onCreated }) {
  const { auth } = useAuth();
  const [name, setName] = useState('');
  const [myPart, setMyPart] = useState(PARTS[0]);
  const [songs, setSongs] = useState('');
  const [equipment, setEquipment] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert('バンド名を入力してください');
      return;
    }
    if (!songs.trim()) {
      alert('演奏曲を入力してください');
      return;
    }
    setSaving(true);
    try {
      const member = await API.getMember(auth.id);
      const result = await API.createBand({
        name: name.trim(),
        members: [{
          id: auth.id,
          name: member?.name || auth.id,
          part: myPart,
        }],
        songs: songs.trim(),
        equipment: equipment.trim(),
        comment: comment.trim(),
        createdBy: auth.id,
      });
      if (result.success) {
        alert('バンドを作成しました');
        onCreated();
        onClose();
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[createBand]', e);
      alert('失敗');
    }
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-lg mx-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">バンド作成</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">バンド名 *</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="バンド名を入力"
              />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">自分の担当パート *</span>
              <select
                value={myPart}
                onChange={e => setMyPart(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                {PARTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">演奏曲 *</span>
              <textarea
                value={songs}
                onChange={e => setSongs(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm h-20 resize-none"
                placeholder="例: 天体観測 / BUMP OF CHICKEN&#10;小さな恋のうた / MONGOL800"
              />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-700">使用機材</span>
              <textarea
                value={equipment}
                onChange={e => setEquipment(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm h-20 resize-none"
                placeholder="例: Fender Stratocaster, Marshall JCM800..."
              />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-bold text-slate-700">ひとこと</span>
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="募集メッセージなど"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {saving ? '作成中...' : '作成'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
