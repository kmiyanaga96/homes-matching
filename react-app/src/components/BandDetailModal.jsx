import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { BAND_STATUS, PARTS } from '../lib/constants';

export default function BandDetailModal({ band, onClose, onUpdated }) {
  const { isLoggedIn, auth } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyPart, setApplyPart] = useState(PARTS[0]);

  const isMember = (band.members || []).some(m => m.id === auth.id);
  const isRecruiting = band.status === 'recruiting';

  useEffect(() => {
    if (isMember) fetchRequests();
  }, [band.id]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const data = await API.getBandRequests(band.id);
      setRequests(data);
    } catch (e) {
      console.error('[fetchRequests]', e);
    }
    setLoading(false);
  }

  async function handleApply() {
    if (!isLoggedIn) return;
    setApplying(true);
    try {
      const member = await API.getMember(auth.id);
      const result = await API.createBandRequest(
        band.id,
        auth.id,
        member?.name || auth.id,
        applyPart
      );
      if (result.success) {
        alert('参加申請しました');
      } else {
        alert(result.message || '失敗');
      }
    } catch (e) {
      console.error('[handleApply]', e);
      alert('失敗');
    }
    setApplying(false);
  }

  async function handleApprove(request) {
    try {
      // 申請を承認
      await API.updateBandRequest(request.id, 'approved');
      // バンドにメンバー追加
      const newMembers = [
        ...(band.members || []),
        { id: request.applicantId, name: request.applicantName, part: request.applicantPart }
      ];
      await API.updateBand(band.id, { members: newMembers });
      alert(`${request.applicantName} を承認しました`);
      fetchRequests();
      onUpdated();
    } catch (e) {
      console.error('[handleApprove]', e);
      alert('失敗');
    }
  }

  async function handleReject(request) {
    try {
      await API.updateBandRequest(request.id, 'rejected');
      alert('申請を却下しました');
      fetchRequests();
    } catch (e) {
      console.error('[handleReject]', e);
    }
  }

  async function handleToggleStatus() {
    const newStatus = isRecruiting ? 'closed' : 'recruiting';
    try {
      await API.updateBand(band.id, { status: newStatus });
      alert(newStatus === 'closed' ? '〆にしました' : '募集中に戻しました');
      onUpdated();
    } catch (e) {
      console.error('[handleToggleStatus]', e);
      alert('失敗');
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{band.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isRecruiting ? 'bg-lime-100 text-lime-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {BAND_STATUS[band.status] || band.status}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Members */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2">メンバー</h3>
            <div className="space-y-2">
              {(band.members || []).map((m, i) => {
                const avatarUrl = `https://unavatar.io/twitter/${m.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || '')}`;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <img
                      src={avatarUrl}
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover bg-slate-200"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || '')}`;
                      }}
                    />
                    <span className="text-sm text-slate-800 font-medium">{m.name || m.id}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full">{m.part}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Songs */}
          {band.songs && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-1">演奏曲</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{band.songs}</p>
            </div>
          )}

          {/* Equipment */}
          {band.equipment && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-1">使用機材</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{band.equipment}</p>
            </div>
          )}

          {/* Comment */}
          {band.comment && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-700 mb-1">ひとこと</h3>
              <p className="text-xs text-slate-600">{band.comment}</p>
            </div>
          )}

          {/* Actions for members: status toggle */}
          {isMember && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <button
                onClick={handleToggleStatus}
                className={`w-full py-2 rounded-xl font-bold text-sm ${
                  isRecruiting
                    ? 'bg-slate-800 text-white'
                    : 'bg-lime-500 text-white'
                }`}
              >
                {isRecruiting ? '〆にする' : '募集中に戻す'}
              </button>
            </div>
          )}

          {/* Pending requests (only for members) */}
          {isMember && requests.length > 0 && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">参加申請 ({requests.length}件)</h3>
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-amber-50 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-bold text-slate-800">{req.applicantName}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{req.applicantPart}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        className="text-[10px] px-3 py-1 bg-lime-500 text-white rounded-full font-bold"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        className="text-[10px] px-3 py-1 bg-slate-200 text-slate-600 rounded-full font-bold"
                      >
                        却下
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button (non-members, recruiting only) */}
          {isLoggedIn && !isMember && isRecruiting && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h3 className="text-sm font-bold text-slate-700 mb-2">参加申請</h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={applyPart}
                  onChange={e => setApplyPart(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {PARTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-4 py-2 bg-lime-500 text-white rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  {applying ? '申請中...' : '申請する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
