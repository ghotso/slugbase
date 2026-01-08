import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import Modal from '../ui/Modal';
import Autocomplete from '../ui/Autocomplete';
import Button from '../ui/Button';
import { Users } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folder_id?: string;
  tags?: Array<{ id: string; name: string }>;
  shared_teams?: Array<{ id: string; name: string }>;
}

interface BookmarkModalProps {
  bookmark: Bookmark | null;
  folders: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onTagCreated?: (tag: { id: string; name: string }) => void;
}

export default function BookmarkModal({
  bookmark,
  folders,
  tags,
  teams,
  isOpen,
  onClose,
  onTagCreated,
}: BookmarkModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    slug: '',
    forwarding_enabled: false,
    folder_ids: [] as string[],
    tag_ids: [] as string[],
    team_ids: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        slug: bookmark.slug,
        forwarding_enabled: bookmark.forwarding_enabled,
        folder_ids: (bookmark as any).folders?.map((f: any) => f.id) || [],
        tag_ids: bookmark.tags?.map((t) => t.id) || [],
        team_ids: bookmark.shared_teams?.map((t) => t.id) || [],
      });
    } else {
      setFormData({
        title: '',
        url: '',
        slug: '',
        forwarding_enabled: false,
        folder_ids: [],
        tag_ids: [],
        team_ids: [],
      });
    }
  }, [bookmark, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        tag_ids: formData.tag_ids,
        team_ids: formData.team_ids,
      };
      if (bookmark) {
        await api.put(`/bookmarks/${bookmark.id}`, payload);
      } else {
        await api.post('/bookmarks', payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  const selectedTags = tags.filter((tag) => formData.tag_ids.includes(tag.id));
  // Note: selectedTeams is used in the team selection UI below

  const handleTagChange = (newTags: Array<{ id: string; name: string }>) => {
    setFormData({ ...formData, tag_ids: newTags.map((t) => t.id) });
  };

  const handleCreateTag = async (name: string): Promise<{ id: string; name: string } | null> => {
    try {
      const response = await api.post('/tags', { name });
      const newTag = { id: response.data.id, name: response.data.name };
      // Notify parent to refresh tags list
      if (onTagCreated) {
        onTagCreated(newTag);
      }
      return newTag;
    } catch {
      return null;
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookmark ? t('bookmarks.edit') : t('bookmarks.create')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.name')}
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.url')}
          </label>
          <input
            type="url"
            required
            className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="forwarding"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            checked={formData.forwarding_enabled}
            onChange={(e) => setFormData({ ...formData, forwarding_enabled: e.target.checked })}
          />
          <label htmlFor="forwarding" className="text-sm font-medium text-gray-900 dark:text-white">
            {t('bookmarks.forwardingEnabled')}
          </label>
        </div>

        {formData.forwarding_enabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('bookmarks.slug')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>
        )}

        {!formData.forwarding_enabled && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {t('bookmarks.slug')} <span className="text-gray-500 text-xs">({t('bookmarks.optional')})</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>
        )}

        {formData.forwarding_enabled && (
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-mono text-blue-800 dark:text-blue-200">
              {window.location.origin}/{user?.user_key}/{formData.slug}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.folders')}
          </label>
          <div className="flex flex-wrap gap-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    folder_ids: formData.folder_ids.includes(folder.id)
                      ? formData.folder_ids.filter((id) => id !== folder.id)
                      : [...formData.folder_ids, folder.id],
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  formData.folder_ids.includes(folder.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {folder.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('bookmarks.foldersDescription')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.tags')}
          </label>
          <Autocomplete
            value={selectedTags}
            onChange={handleTagChange}
            options={tags}
            placeholder={t('bookmarks.tags')}
            onCreateNew={handleCreateTag}
          />
        </div>

        {teams.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <Users className="inline h-4 w-4 mr-1.5" />
              {t('bookmarks.shareWithTeams')}
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
              {t('bookmarks.shareWithTeamsDescription')}
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
