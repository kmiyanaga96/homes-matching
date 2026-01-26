import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { path: '/search', label: '検索', icon: SearchIcon },
  { path: '/live', label: 'ライブ', icon: LiveIcon },
  { path: '/schedule', label: '予定', icon: ScheduleIcon },
  { path: '/notices', label: 'お知らせ', icon: NoticeIcon },
  { path: '/account', label: 'アカウント', icon: AccountIcon, requireAuth: true },
];

function SearchIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-slate-800' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function LiveIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-slate-800' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function ScheduleIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-slate-800' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function NoticeIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-slate-800' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function AccountIcon({ active }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-slate-800' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function BottomNav({ onLoginClick }) {
  const { isLoggedIn } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto pb-safe">
        {tabs.map(tab => {
          // Auth-required tab when not logged in - show login modal
          if (tab.requireAuth && !isLoggedIn) {
            return (
              <button
                key={tab.path}
                onClick={onLoginClick}
                className="flex flex-col items-center justify-center flex-1 py-2"
              >
                <tab.icon active={false} />
                <span className="text-[10px] mt-1 text-slate-400">{tab.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 py-2"
            >
              {({ isActive }) => (
                <>
                  <tab.icon active={isActive} />
                  <span className={`text-[10px] mt-1 ${isActive ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
