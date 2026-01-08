import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Check, Mail, User as UserIcon, Key, Globe, Palette } from 'lucide-react';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  const languageOptions = [
    { value: 'en', label: t('profile.languageEnglish') },
    { value: 'de', label: t('profile.languageGerman') },
    { value: 'fr', label: t('profile.languageFrench') },
  ];

  const themeOptions = [
    { value: 'auto', label: t('profile.themeAuto') },
    { value: 'light', label: t('profile.themeLight') },
    { value: 'dark', label: t('profile.themeDark') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('profile.description')}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t('profile.email')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Name */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t('profile.name')}
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.name}</p>
            </div>
          </div>

          {/* User Key */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('profile.userKey')}
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white">
                  {user.user_key}
                </code>
                <button
                  onClick={handleCopyUserKey}
                  className="flex-shrink-0 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title={t('bookmarks.copyUrl')}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {t('bookmarks.copied')}
                </p>
              )}
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t('profile.language')}
                </label>
                <Select
                  value={formData.language}
                  onChange={(value) => setFormData({ ...formData, language: value })}
                  options={languageOptions}
                />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t('profile.theme')}
                </label>
                <Select
                  value={formData.theme}
                  onChange={(value) => setFormData({ ...formData, theme: value })}
                  options={themeOptions}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('common.loading') : t('profile.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
