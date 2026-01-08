import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface Tag {
  id: string;
  name: string;
}

interface TagModalProps {
  tag: Tag | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TagModal({ tag, isOpen, onClose, onSuccess }: TagModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tag) {
      setFormData({ name: tag.name });
    } else {
      setFormData({ name: '' });
    }
    setError('');
  }, [tag, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tag) {
        await api.put(`/tags/${tag.id}`, formData);
      } else {
        await api.post('/tags', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tag ? t('tags.edit') : t('tags.create')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('tags.name')}
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
          />
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
