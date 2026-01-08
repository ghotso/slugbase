import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { Save, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import Button from '../ui/Button';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.settings')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {Object.keys(settings).length} {Object.keys(settings).length === 1 ? 'setting' : 'settings'}
        </p>
      </div>

      {/* Existing Settings */}
      {Object.keys(settings).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(settings).map(([key, value]) => (
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
