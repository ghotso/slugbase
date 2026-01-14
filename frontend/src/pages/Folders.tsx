import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { Plus, Edit, Trash2, Share2 } from 'lucide-react';
import FolderModal from '../components/modals/FolderModal';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import FolderIcon from '../components/FolderIcon';

interface Folder {
  id: string;
  name: string;
  icon?: string | null;
  shared_teams?: Array<{ id: string; name: string }>;
  shared_users?: Array<{ id: string; name: string; email: string }>;
  folder_type?: 'own' | 'shared';
}

export default function Folders() {
  const { t } = useTranslation();
  const { showConfirm, dialogState } = useConfirmDialog();
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
      // Filter to only show own folders (not shared)
      const ownFolders = foldersRes.data.filter((f: Folder) => f.folder_type === 'own');
      setFolders(ownFolders);
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

  function handleDelete(id: string) {
    const folder = folders.find(f => f.id === id);
    const folderName = folder?.name || 'this folder';
    showConfirm(
      t('folders.deleteFolder'),
      t('folders.deleteConfirmWithName', { name: folderName }),
      async () => {
        try {
          await api.delete(`/folders/${id}`);
          loadData();
        } catch (error) {
          console.error('Failed to delete folder:', error);
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('folders.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {folders.length} {folders.length === 1 ? t('common.folder') : t('common.folders')}
          </p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          {t('folders.create')}
        </Button>
      </div>

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FolderIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t('folders.empty')}</p>
          <Button onClick={handleCreate} variant="primary" size="sm" icon={Plus}>
            {t('folders.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                {/* Header with icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                    <FolderIcon iconName={folder.icon} size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-[15px] font-medium text-gray-900 dark:text-white truncate mb-1.5">
                      {folder.name}
                    </h3>
                    {folder.shared_teams && folder.shared_teams.length > 0 && (
                      <Tooltip
                        content={
                          <div className="space-y-1">
                            <div className="font-semibold mb-1">{t('folders.sharedWith')}</div>
                            {folder.shared_teams.map((team) => (
                              <div key={team.id} className="text-xs">
                                • {team.name}
                              </div>
                            ))}
                            {folder.shared_users && folder.shared_users.length > 0 && (
                              <>
                                {folder.shared_users.map((user) => (
                                  <div key={user.id} className="text-xs">
                                    • {user.name || user.email}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        }
                      >
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800/50 cursor-help">
                          <Share2 className="h-3 w-3" />
                          {t('folders.shared')}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {folder.folder_type === 'own' && (
                  <div className="flex gap-2 pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50">
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
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2"
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

      <ConfirmDialog {...dialogState} />
    </div>
  );
}
