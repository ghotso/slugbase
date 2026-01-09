import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import TagModal from '../components/modals/TagModal';
import Button from '../components/ui/Button';

interface Tag {
  id: string;
  name: string;
}

export default function Tags() {
  const { t } = useTranslation();
  const { showConfirm, dialogState } = useConfirmDialog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const res = await api.get('/tags');
      setTags(res.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingTag(null);
    setModalOpen(true);
  }

  function handleEdit(tag: Tag) {
    setEditingTag(tag);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    showConfirm(
      t('tags.deleteTag'),
      t('tags.deleteConfirm'),
      async () => {
        try {
          await api.delete(`/tags/${id}`);
          loadTags();
        } catch (error) {
          console.error('Failed to delete tag:', error);
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingTag(null);
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
            {t('tags.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tags.length} {tags.length === 1 ? t('common.tag') : t('common.tags')}
          </p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          {t('tags.create')}
        </Button>
      </div>

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <TagIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t('tags.empty')}</p>
          <Button onClick={handleCreate} variant="primary" size="sm" icon={Plus}>
            {t('tags.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                {/* Header with icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 flex items-center justify-center border border-purple-100 dark:border-purple-800/50">
                    <TagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {tag.name}
                    </h3>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEdit(tag)}
                    className="flex-1 text-xs"
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(tag.id)}
                    title={t('common.delete')}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TagModal
        tag={editingTag}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={loadTags}
      />

      <ConfirmDialog {...dialogState} />
    </div>
  );
}
