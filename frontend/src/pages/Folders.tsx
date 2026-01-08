import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Plus, Edit, Trash2, Share2 } from 'lucide-react';
import FolderModal from '../components/modals/FolderModal';
import Button from '../components/ui/Button';
import FolderIcon from '../components/FolderIcon';

interface Folder {
  id: string;
  name: string;
  icon?: string | null;
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
              <div className="p-4 space-y-3">
                {/* Header with icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <FolderIcon iconName={folder.icon} size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {folder.name}
                    </h3>
                    {folder.folder_type === 'shared' && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        <Share2 className="h-3 w-3" />
                        {t('folders.shared')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Shared Teams - compact */}
                {folder.shared_teams && folder.shared_teams.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {folder.shared_teams.slice(0, 2).map((team) => (
                      <span
                        key={team.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded"
                      >
                        <Share2 className="h-3 w-3" />
                        {team.name}
                      </span>
                    ))}
                    {folder.shared_teams.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{folder.shared_teams.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions - minimal */}
                {folder.folder_type === 'own' && (
                  <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleEdit(folder)}
                      className="flex-1 text-xs"
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(folder.id)}
                      title={t('common.delete')}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
