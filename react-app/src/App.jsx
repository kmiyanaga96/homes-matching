import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { onForegroundMessage } from './lib/firebase';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import EventsPage from './pages/EventsPage';
import SchedulePage from './pages/SchedulePage';
import NoticesPage from './pages/NoticesPage';
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';
import LoginModal from './components/LoginModal';
import './index.css';

function AppContent() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribe;
    onForegroundMessage((payload) => {
      console.log('[FCM] Foreground message:', payload);
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === 'granted') {
        new Notification(title, { body: body || '', icon: '/homes-logo.png' });
      }
    }).then(unsub => { unsubscribe = unsub; });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout onLoginClick={() => setLoginModalOpen(true)} />}>
          <Route index element={<Navigate to="/search" replace />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
