import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';

export default function LoginModal({ isOpen, onClose }) {
  const [id, setId] = useState('@');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // @を除去してIDを取得
    const trimmedId = id.replace(/^@/, '').trim();
    const trimmedPass = pass.trim();

    if (!trimmedId || !/^\d{4}$/.test(trimmedPass)) {
      alert('IDとPW（数字4桁）を入力してください');
      return;
    }

    setLoading(true);
    try {
      const result = await API.verifyMember(trimmedId, trimmedPass);

      if (!result.exists) {
        // New user
        login(trimmedId, trimmedPass, true);
        onClose();
        navigate('/account');
        return;
      }

      if (!result.valid) {
        alert('パスワードが違います');
        setLoading(false);
        return;
      }

      // Existing user with correct password
      login(trimmedId, trimmedPass, false);
      onClose();
      navigate('/search');
    } catch (e) {
      console.error('[login]', e);
      alert('ログインに失敗しました');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 animate-scale-in">
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">ログイン</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID (Xユーザー名)
            </label>
            <input
              type="text"
              value={id}
              onChange={e => {
                const val = e.target.value;
                // @が消されないようにする
                if (!val.startsWith('@')) {
                  setId('@' + val.replace(/@/g, ''));
                } else {
                  setId(val);
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="@username"
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              パスワード (数字4桁)
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="0000"
              maxLength={4}
              autoComplete="current-password"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          新規の方はIDとPWを入力するだけで登録できます
        </p>
      </div>
    </div>
  );
}
