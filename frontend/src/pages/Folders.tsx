import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Plus, Edit, Trash2, Share2, Folder as FolderIcon } from 'lucide-react';
import FolderModal from '../components/modals/FolderModal';
import Button from '../components/ui/Button';

interface Folder {
  id: string;
  name: string;
  shared_teams?: Array<{ id: string; name: string }>;
  folder_type?: 'own' | 'shared';
}

export default function Folders() {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [foldersRes, teamsRes] = await Promise.all([
        api.get('/folders'),
        api.get('/teams'),
      ]);
      setFolders(foldersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingFolder(null);
    setModalOpen(true);
  }

  function handleEdit(folder: Folder) {
    setEditingFolder(folder);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm(t('folders.deleteConfirm'))) return;
    try {
      await api.delete(`/folders/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingFolder(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('folders.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
          </p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          {t('folders.create')}
        </Button>
      </div>

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FolderIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t('folders.empty')}</p>
          <Button onClick={handleCreate} variant="primary" size="sm" icon={Plus}>
            {t('folders.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FolderIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {folder.name}
                    </h3>
                  </div>
                  {folder.folder_type === 'shared' && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg">
                      <Share2 className="h-3 w-3" />
                      {t('folders.shared')}
                    </span>
                  )}
                </div>

                {/* Shared Teams */}
                {folder.shared_teams && folder.shared_teams.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {folder.shared_teams.map((team) => (
                      <span
                        key={team.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded-lg"
                      >
                        <Share2 className="h-3 w-3" />
                        {team.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {folder.folder_type === 'own' && (
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleEdit(folder)}
                      className="flex-1"
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(folder.id)}
                      title={t('common.delete')}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FolderModal
        folder={editingFolder}
        teams={teams}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={loadData}
      />
    </div>
  );
}
