import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { LogIn, Key } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localAuth, setLocalAuth] = useState({
    email: '',
    password: '',
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/auth/providers')
      .then(res => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleOIDCLogin = (providerKey: string) => {
    window.location.href = `/api/auth/${providerKey}`;
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError('');

    try {
      await api.post('/auth/login', localAuth);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('app.tagline')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-8 space-y-6">
          {/* Local Authentication Form */}
          <form onSubmit={handleLocalLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t('auth.emailPlaceholder')}
                value={localAuth.email}
                onChange={(e) => setLocalAuth({ ...localAuth, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t('auth.passwordPlaceholder')}
                value={localAuth.password}
                onChange={(e) => setLocalAuth({ ...localAuth, password: e.target.value })}
              />
            </div>
            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={localLoading}
              icon={LogIn}
              className="w-full"
            >
              {localLoading ? t('common.loading') : t('auth.login')}
            </Button>
            <div className="text-center">
              <Link
                to="/password-reset"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </form>

          {/* OIDC Providers */}
          {!loading && providers.length > 0 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t('auth.or')}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {providers.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="secondary"
                    icon={Key}
                    onClick={() => handleOIDCLogin(provider.provider_key)}
                    className="w-full"
                  >
                    {t('auth.loginWith', { provider: provider.provider_key })}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
