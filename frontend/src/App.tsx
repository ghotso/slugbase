import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookmarks from './pages/Bookmarks';
import Folders from './pages/Folders';
import Tags from './pages/Tags';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Shared from './pages/Shared';
import PasswordReset from './pages/PasswordReset';
import SearchEngineGuide from './pages/SearchEngineGuide';
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

function AdminRoute({ children }: { children: React.ReactNode }) {
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

  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [setupStatus, setSetupStatus] = React.useState<{ initialized: boolean } | null>(null);
  const [setupLoading, setSetupLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/auth/setup/status')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch setup status');
        return res.json();
      })
      .then(data => {
        setSetupStatus(data);
        setSetupLoading(false);
      })
      .catch((error) => {
        console.error('Error checking setup status:', error);
        // On error, assume initialized to show login page
        setSetupStatus({ initialized: true });
        setSetupLoading(false);
      });
  }, []);

  // Show loading while checking setup status or auth
  if (setupLoading || (loading && setupStatus?.initialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  // Show setup page if system is not initialized
  if (setupStatus && !setupStatus.initialized) {
    return <Setup />;
  }

  // System is initialized - show normal routes
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      {/* Forwarding URLs: /{user_key}/{slug} - handled by backend, frontend should not catch these */}
      <Route
        path="/:user_key/:slug"
        element={<ForwardingHandler />}
      />
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
        <Route path="shared" element={<Shared />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search-engine-guide" element={<SearchEngineGuide />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

// Component to handle forwarding URLs - redirects to backend
function ForwardingHandler() {
  const location = useLocation();
  const { pathname } = location;
  const { t } = useTranslation();

  React.useEffect(() => {
    // In development, redirect to backend (port 5000)
    // In production, the backend serves the frontend, so just redirect to pathname
    // Check if we're in development by checking if we're on localhost (any port)
    // This handles both direct access (port 3000) and WSL port forwarding (port 3001)
    const isDevelopment = window.location.hostname === 'localhost';
    const backendUrl = isDevelopment 
      ? `http://localhost:5000${pathname}`
      : pathname;
    
    // Redirect to backend which will handle the forwarding
    // The backend will return a 302 redirect to the actual bookmark URL
    window.location.href = backendUrl;
  }, [pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
