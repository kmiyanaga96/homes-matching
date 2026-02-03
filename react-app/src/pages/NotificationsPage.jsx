import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { requestFCMToken } from '../lib/firebase';

// 通知の種類
const NOTIFICATION_TYPES = [
  { key: 'eventCreate', label: '新規イベント作成' },
  { key: 'entryStart', label: 'エントリー開始' },
  { key: 'entryEnd', label: 'エントリー締切前' },
  { key: 'lotteryResult', label: '抽選結果' },
  { key: 'bandRequest', label: 'バンド参加申請' },
  { key: 'timetablePublish', label: 'タイムテーブル公開' },
  { key: 'setlistPublish', label: 'セットリスト公開' },
  { key: 'notice', label: 'お知らせ' },
];

export default function NotificationsPage() {
  const { isLoggedIn, auth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [settings, setSettings] = useState(() => {
    const defaults = {};
    NOTIFICATION_TYPES.forEach(t => { defaults[t.key] = true; });
    return defaults;
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/search');
      return;
    }
    fetchSettings();
  }, [isLoggedIn]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const data = await API.getNotificationSettings(auth.id);
      if (data) {
        setPushEnabled(data.pushEnabled || false);
        if (data.types) {
          setSettings(prev => ({ ...prev, ...data.types }));
        }
      }
    } catch (e) {
      console.error('[fetchSettings]', e);
    }
    setLoading(false);
  }

  async function handleEnablePush() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const token = await requestFCMToken();
        if (token) {
          await API.saveFCMToken(auth.id, token);
          setPushEnabled(true);
          await saveSettings(true, settings);
          alert('プッシュ通知をONにしました');
        } else {
          alert('トークン取得に失敗しました');
        }
      }
    } catch (e) {
      console.error('[handleEnablePush]', e);
      alert('通知の設定に失敗しました');
    }
  }

  async function handleDisablePush() {
    try {
      await API.removeFCMToken(auth.id);
      setPushEnabled(false);
      await saveSettings(false, settings);
      alert('プッシュ通知をOFFにしました');
    } catch (e) {
      console.error('[handleDisablePush]', e);
    }
  }

  function toggleType(key) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveSettings(enabled = pushEnabled, types = settings) {
    setSaving(true);
    try {
      await API.saveNotificationSettings(auth.id, { pushEnabled: enabled, types });
    } catch (e) {
      console.error('[saveSettings]', e);
    }
    setSaving(false);
  }

  async function handleSave() {
    await saveSettings();
    alert('設定を保存しました');
  }

  if (!isLoggedIn) return null;

  if (loading) {
    return <div className="py-4 text-center text-slate-500">読み込み中...</div>;
  }

  return (
    <div className="py-4">
      {/* Push Notification Toggle */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">プッシュ通知</h2>

        {permission === 'unsupported' ? (
          <p className="text-sm text-slate-500">このブラウザはプッシュ通知に対応していません</p>
        ) : permission === 'denied' ? (
          <p className="text-sm text-slate-500">
            通知がブロックされています。ブラウザの設定から通知を許可してください。
          </p>
        ) : pushEnabled ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-lime-700">通知ON</span>
              <p className="text-xs text-slate-500 mt-1">プッシュ通知を受け取ります</p>
            </div>
            <button onClick={handleDisablePush}
              className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm">
              OFFにする
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-500">通知OFF</span>
              <p className="text-xs text-slate-500 mt-1">プッシュ通知を受け取りません</p>
            </div>
            <button onClick={handleEnablePush}
              className="px-4 py-2 bg-lime-500 text-white rounded-lg font-bold text-sm">
              ONにする
            </button>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">通知の種類</h2>
        <p className="text-xs text-slate-500 mb-4">受け取りたい通知を選択してください</p>

        <div className="space-y-3">
          {NOTIFICATION_TYPES.map(type => (
            <label key={type.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-700">{type.label}</span>
              <button
                onClick={() => toggleType(type.key)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings[type.key] ? 'bg-lime-500' : 'bg-slate-200'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings[type.key] ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
}
