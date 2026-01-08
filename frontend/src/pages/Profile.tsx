import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Copy } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    language: 'en',
    theme: 'auto',
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        language: user.language || 'en',
        theme: user.theme || 'auto',
      });
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(formData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleCopyUserKey() {
    if (user?.user_key) {
      navigator.clipboard.writeText(user.user_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!user) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('profile.title')}
      </h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.email')}
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.name')}
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.userKey')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                {user.user_key}
              </code>
              <button
                onClick={handleCopyUserKey}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                title={t('bookmarks.copyUrl')}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                {t('bookmarks.copied')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('profile.language')}
              </label>
              <select
                id="language"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="en">{t('profile.languageEnglish')}</option>
                <option value="de">{t('profile.languageGerman')}</option>
                <option value="fr">{t('profile.languageFrench')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('profile.theme')}
              </label>
              <select
                id="theme"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              >
                <option value="auto">{t('profile.themeAuto')}</option>
                <option value="light">{t('profile.themeLight')}</option>
                <option value="dark">{t('profile.themeDark')}</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('profile.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
