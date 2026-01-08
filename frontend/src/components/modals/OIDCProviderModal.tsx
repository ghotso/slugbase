import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Key } from 'lucide-react';

interface OIDCProvider {
  id: string;
  provider_key: string;
  issuer_url: string;
  scopes: string;
  auto_create_users: boolean;
  default_role: string;
}

interface OIDCProviderModalProps {
  provider: OIDCProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OIDCProviderModal({
  provider,
  isOpen,
  onClose,
  onSuccess,
}: OIDCProviderModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    provider_key: '',
    client_id: '',
    client_secret: '',
    issuer_url: '',
    scopes: 'openid profile email',
    auto_create_users: true,
    default_role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider) {
      setFormData({
        provider_key: provider.provider_key,
        client_id: '',
        client_secret: '',
        issuer_url: provider.issuer_url,
        scopes: provider.scopes,
        auto_create_users: provider.auto_create_users,
        default_role: provider.default_role,
      });
    } else {
      setFormData({
        provider_key: '',
        client_id: '',
        client_secret: '',
        issuer_url: '',
        scopes: 'openid profile email',
        auto_create_users: true,
        default_role: 'user',
      });
    }
    setError('');
  }, [provider, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const api = (await import('../../api/client')).default;
      const payload: any = { ...formData };
      if (!payload.client_secret) {
        delete payload.client_secret;
      }

      if (provider) {
        await api.put(`/oidc-providers/${provider.id}`, payload);
      } else {
        await api.post('/oidc-providers', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = [
    { value: 'user', label: t('admin.user') },
    { value: 'admin', label: t('admin.admin') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={provider ? t('admin.editProvider') : t('admin.addProvider')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <Key className="inline h-4 w-4 mr-1.5" />
              {t('admin.providerKey')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.provider_key}
              onChange={(e) => setFormData({ ...formData, provider_key: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.issuerUrl')}
            </label>
            <input
              type="url"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.issuer_url}
              onChange={(e) => setFormData({ ...formData, issuer_url: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.clientId')}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.clientSecret')}{' '}
              {provider && <span className="text-xs text-gray-500">({t('admin.leaveBlank')})</span>}
            </label>
            <input
              type="password"
              required={!provider}
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.client_secret}
              onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('admin.scopes')}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.scopes}
            onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_create"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              checked={formData.auto_create_users}
              onChange={(e) => setFormData({ ...formData, auto_create_users: e.target.checked })}
            />
            <label htmlFor="auto_create" className="text-sm font-medium text-gray-900 dark:text-white">
              {t('admin.autoCreate')}
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.defaultRole')}
            </label>
            <Select
              value={formData.default_role}
              onChange={(value) => setFormData({ ...formData, default_role: value })}
              options={roleOptions}
            />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
