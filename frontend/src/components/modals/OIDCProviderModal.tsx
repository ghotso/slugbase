import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Key } from 'lucide-react';
import api from '../../api/client';

interface OIDCProvider {
  id: string;
  provider_key: string;
  issuer_url: string;
  authorization_url?: string;
  token_url?: string;
  userinfo_url?: string;
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
    authorization_url: '',
    token_url: '',
    userinfo_url: '',
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
        authorization_url: provider.authorization_url || '',
        token_url: provider.token_url || '',
        userinfo_url: provider.userinfo_url || '',
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
        authorization_url: '',
        token_url: '',
        userinfo_url: '',
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
      const payload: any = { ...formData };
      
      if (provider) {
        // When editing, don't send client_id if empty (keep existing)
        if (!payload.client_id || payload.client_id.trim() === '') {
          delete payload.client_id;
        }
        // Don't send client_secret if empty (keep existing)
        if (!payload.client_secret || payload.client_secret.trim() === '') {
          delete payload.client_secret;
        }
      } else {
        // When creating, client_id is required
        if (!payload.client_id || payload.client_id.trim() === '') {
          setError(t('admin.clientIdRequired'));
          setLoading(false);
          return;
        }
      }
      
      // Remove empty endpoint URLs (use defaults)
      if (!payload.authorization_url || payload.authorization_url.trim() === '') {
        delete payload.authorization_url;
      }
      if (!payload.token_url || payload.token_url.trim() === '') {
        delete payload.token_url;
      }
      if (!payload.userinfo_url || payload.userinfo_url.trim() === '') {
        delete payload.userinfo_url;
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
              className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.issuer_url}
              onChange={(e) => setFormData({ ...formData, issuer_url: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.clientId')}
              {provider && <span className="text-xs text-gray-500 ml-1">({t('admin.leaveBlankToKeep')})</span>}
            </label>
            <input
              type="text"
              required={!provider}
              className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              placeholder={provider ? t('admin.leaveBlankToKeep') : ''}
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
              className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.scopes}
            onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
          />
        </div>

        {/* Custom OIDC Endpoints (Optional) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('admin.customEndpoints')} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({t('admin.optional')})</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            {t('admin.customEndpointsDescription')}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('admin.authorizationUrl')}
              </label>
              <input
                type="url"
                className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`${formData.issuer_url || 'https://issuer.com'}/authorize`}
                value={formData.authorization_url}
                onChange={(e) => setFormData({ ...formData, authorization_url: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('admin.tokenUrl')}
              </label>
              <input
                type="url"
                className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`${formData.issuer_url || 'https://issuer.com'}/token`}
                value={formData.token_url}
                onChange={(e) => setFormData({ ...formData, token_url: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('admin.userinfoUrl')}
              </label>
              <input
                type="url"
                className="w-full px-4 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`${formData.issuer_url || 'https://issuer.com'}/userinfo`}
                value={formData.userinfo_url}
                onChange={(e) => setFormData({ ...formData, userinfo_url: e.target.value })}
              />
            </div>
          </div>
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
