import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { requestFCMToken } from '../lib/firebase';
import { getVisibleEvents, getEventColor, PARTS, GRADES } from '../lib/constants';

export default function AccountPage() {
  const { isLoggedIn, auth, isFirstLogin, clearFirstLogin } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('1');
  const [comment, setComment] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const visibleEvents = getVisibleEvents();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/search');
      return;
    }

    if (isFirstLogin) {
      clearFirstLogin();
    }

    fetchMember();
  }, [isLoggedIn]);

  async function fetchMember() {
    setLoading(true);
    try {
      const data = await API.getMember(auth.id);
      if (data) {
        setMember(data);
        setName(data.name || '');
        setGrade(data.grade || '1');
        setComment(data.comment || '');
        setSelectedParts((data.part || '').split('/').filter(Boolean));
        setSelectedStatuses((data.status || '').split('/').filter(Boolean));
      }
    } catch (e) {
      console.error('[fetchMember]', e);
    }
    setLoading(false);
  }

  const togglePart = (part) => {
    setSelectedParts(prev =>
      prev.includes(part)
        ? prev.filter(p => p !== part)
        : [...prev, part]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  async function handleSave() {
    if (!name.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (selectedParts.length === 0) {
      alert('パートを選択してください');
      return;
    }
    if (selectedStatuses.length === 0) {
      alert('ステータスを選択してください');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: auth.id,
        pass: auth.pass,
        name: name.trim(),
        grade,
        part: selectedParts.join('/'),
        status: selectedStatuses.join('/'),
        comment: comment.trim()
      };

      const result = await API.saveMember(payload);
      alert(result.message);

      if (result.success) {
        fetchMember();
      }
    } catch (e) {
      console.error('[handleSave]', e);
      alert('保存に失敗しました');
    }
    setSaving(false);
  }

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="py-4 text-center text-slate-500">読み込み中...</div>
    );
  }

  return (
    <div className="py-4">
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">マイページ</h2>
          <span className="text-xs text-slate-500">ID: {auth.id}</span>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="名前を入力"
          />
        </div>

        {/* Grade */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">学年</label>
          <select
            value={grade}
            onChange={e => setGrade(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Parts */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">パート</label>
          <div className="flex flex-wrap gap-2">
            {PARTS.map(part => (
              <button
                key={part}
                onClick={() => togglePart(part)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedParts.includes(part)
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {part}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">募集中のライブ</label>
          <div className="flex flex-wrap gap-2">
            {visibleEvents.map(event => {
              const color = getEventColor(event.name);
              const isActive = selectedStatuses.includes(event.name);
              return (
                <button
                  key={event.name}
                  onClick={() => toggleStatus(event.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                    isActive
                      ? `${color.active} ${color.text} ${color.ring} ring-2`
                      : `${color.bg} ${color.text} ${color.border}`
                  }`}
                >
                  {event.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">ひとこと</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 resize-none"
            placeholder="自己紹介など"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* Notification Settings */}
      <NotificationSettings memberId={auth.id} />
    </div>
  );
}

function NotificationSettings({ memberId }) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const token = await requestFCMToken();
        if (token) {
          await API.saveFCMToken(memberId, token);
          alert('通知をONにしました');
        } else {
          alert('トークン取得に失敗しました。ブラウザが対応していない可能性があります。');
        }
      }
    } catch (e) {
      console.error('[enableNotification]', e);
      alert('通知の設定に失敗しました');
    }
    setLoading(false);
  }

  async function handleDisable() {
    setLoading(true);
    try {
      await API.removeFCMToken(memberId);
      alert('通知をOFFにしました');
    } catch (e) {
      console.error('[disableNotification]', e);
    }
    setLoading(false);
  }

  if (permission === 'unsupported') return null;

  return (
    <div className="bg-white rounded-2xl shadow p-4 mt-4">
      <h3 className="font-bold text-slate-800 mb-3">プッシュ通知</h3>
      {permission === 'granted' ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-lime-700 font-bold">通知ON</span>
          <button onClick={handleDisable} disabled={loading}
            className="text-xs px-4 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold disabled:opacity-50">
            {loading ? '...' : 'OFFにする'}
          </button>
        </div>
      ) : permission === 'denied' ? (
        <p className="text-sm text-slate-500">
          通知がブロックされています。ブラウザの設定から通知を許可してください。
        </p>
      ) : (
        <button onClick={handleEnable} disabled={loading}
          className="w-full py-2 bg-lime-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">
          {loading ? '設定中...' : '通知をONにする'}
        </button>
      )}
    </div>
  );
}
