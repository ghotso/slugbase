import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookmarks from './pages/Bookmarks';
import Folders from './pages/Folders';
import Tags from './pages/Tags';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [setupStatus, setSetupStatus] = React.useState<{ initialized: boolean } | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/setup/status')
      .then(res => res.json())
      .then(data => setSetupStatus(data))
      .catch(() => setSetupStatus({ initialized: true }));
  }, []);

  if (loading || !setupStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!setupStatus.initialized) {
    return <Setup />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="folders" element={<Folders />} />
        <Route path="tags" element={<Tags />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
