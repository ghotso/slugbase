import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Login() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/providers')
      .then(res => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (providerKey: string) => {
    window.location.href = `/api/auth/${providerKey}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('app.tagline')}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="text-center">{t('common.loading')}</div>
          ) : providers.length === 0 ? (
            <div className="text-center text-red-600 dark:text-red-400">
              {t('auth.authFailed')}
            </div>
          ) : (
            providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleLogin(provider.provider_key)}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('auth.loginWith', { provider: provider.provider_key })}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
