import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Users } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  shared_teams?: Array<{ id: string; name: string }>;
  folder_type?: 'own' | 'shared';
}

interface FolderModalProps {
  folder: Folder | null;
  teams: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FolderModal({
  folder,
  teams,
  isOpen,
  onClose,
  onSuccess,
}: FolderModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    team_ids: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name,
        team_ids: folder.shared_teams?.map((t) => t.id) || [],
      });
    } else {
      setFormData({ name: '', team_ids: [] });
    }
    setError('');
  }, [folder, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        team_ids: formData.team_ids,
      };
      if (folder) {
        await api.put(`/folders/${folder.id}`, payload);
      } else {
        await api.post('/folders', payload);
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
      title={folder ? t('folders.edit') : t('folders.create')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('folders.name')}
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {teams.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <Users className="inline h-4 w-4 mr-1.5" />
              {t('folders.shareWithTeams')}
            </label>
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      team_ids: formData.team_ids.includes(team.id)
                        ? formData.team_ids.filter((id) => id !== team.id)
                        : [...formData.team_ids, team.id],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.team_ids.includes(team.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('folders.shareWithTeamsDescription')}
            </p>
          </div>
        )}

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
