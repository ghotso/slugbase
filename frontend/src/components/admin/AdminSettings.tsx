import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { Save, Plus, Trash2, Settings as SettingsIcon, Mail, Send } from 'lucide-react';
import Button from '../ui/Button';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // SMTP settings state
  const [smtpSettings, setSmtpSettings] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from: '',
    fromName: 'SlugBase',
  });
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      const allSettings = response.data;
      setSettings(allSettings);

      // Load SMTP settings
      setSmtpSettings({
        enabled: allSettings.smtp_enabled === 'true',
        host: allSettings.smtp_host || '',
        port: parseInt(allSettings.smtp_port || '587'),
        secure: allSettings.smtp_secure === 'true',
        user: allSettings.smtp_user || '',
        password: '', // Don't load password for security
        from: allSettings.smtp_from || '',
        fromName: allSettings.smtp_from_name || 'SlugBase',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      await api.post('/admin/settings', { key, value });
      setSettings({ ...settings, [key]: value });
    } catch (error: any) {
      alert(error.response?.data?.error || t('common.error'));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    try {
      await api.post('/admin/settings', { key: newKey, value: newValue });
      setSettings({ ...settings, [newKey]: newValue });
      setNewKey('');
      setNewValue('');
    } catch (error: any) {
      alert(error.response?.data?.error || t('common.error'));
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(t('admin.confirmDeleteSetting'))) return;
    try {
      await api.delete(`/admin/settings/${key}`);
      const newSettings = { ...settings };
      delete newSettings[key];
      setSettings(newSettings);
    } catch (error: any) {
      alert(error.response?.data?.error || t('common.error'));
    }
  };

  const handleSMTPSave = async () => {
    try {
      await api.post('/admin/settings/smtp', smtpSettings);
      alert(t('common.success'));
      await loadSettings();
    } catch (error: any) {
      alert(error.response?.data?.error || t('common.error'));
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }
    setTestingEmail(true);
    try {
      await api.post('/admin/settings/smtp/test', { email: testEmail });
      alert(t('smtp.testSent'));
    } catch (error: any) {
      alert(error.response?.data?.error || t('smtp.testFailed'));
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  // Filter out SMTP settings from general settings display
  const generalSettings = Object.fromEntries(
    Object.entries(settings).filter(([key]) => !key.startsWith('smtp_'))
  );

  return (
    <div className="space-y-6">
      {/* SMTP Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('smtp.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('smtp.description')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smtp-enabled"
              checked={smtpSettings.enabled}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="smtp-enabled" className="text-sm font-medium text-gray-900 dark:text-white">
              {t('smtp.enabled')}
            </label>
          </div>

          {smtpSettings.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.host')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.hostPlaceholder')}
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.port')}
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.portPlaceholder')}
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) || 587 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.user')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.userPlaceholder')}
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.password')}
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.passwordPlaceholder')}
                    value={smtpSettings.password}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('admin.leaveBlank')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.from')}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.fromPlaceholder')}
                    value={smtpSettings.from}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.fromName')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.fromNamePlaceholder')}
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="smtp-secure"
                  checked={smtpSettings.secure}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, secure: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="smtp-secure" className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('smtp.secure')}
                </label>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('smtp.testEmail')}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={t('smtp.testEmailPlaceholder')}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="pt-6">
                  <Button
                    variant="ghost"
                    icon={Send}
                    onClick={handleTestEmail}
                    disabled={testingEmail || !testEmail}
                  >
                    {t('smtp.sendTest')}
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="primary" icon={Save} onClick={handleSMTPSave}>
                  {t('smtp.save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* General Settings Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.settings')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {Object.keys(generalSettings).length} {Object.keys(generalSettings).length === 1 ? 'setting' : 'settings'}
        </p>
      </div>

      {/* Existing Settings */}
      {Object.keys(generalSettings).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(generalSettings).map(([key, value]) => (
              <div key={key} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {key}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={value}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Save}
                      onClick={() => handleSave(key, settings[key])}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(key)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Setting */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin.addSetting')}
          </h3>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('admin.settingKey')}
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {t('admin.settingValue')}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" variant="primary" icon={Plus}>
            {t('admin.addSetting')}
          </Button>
        </form>
      </div>
    </div>
  );
}
