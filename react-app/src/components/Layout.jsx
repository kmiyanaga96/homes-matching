import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <Outlet context={{ onLoginClick }} />
      </main>
      <BottomNav onLoginClick={onLoginClick} />
    </div>
  );
}
