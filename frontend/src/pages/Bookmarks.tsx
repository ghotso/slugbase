import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { Plus, Edit, Trash2, Copy, ExternalLink, Share2, Tag as TagIcon } from 'lucide-react';
import BookmarkModal from '../components/modals/BookmarkModal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Favicon from '../components/Favicon';
import FolderIcon from '../components/FolderIcon';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folders?: Array<{ id: string; name: string; icon?: string | null }>;
  tags?: Array<{ id: string; name: string }>;
  shared_teams?: Array<{ id: string; name: string }>;
  bookmark_type?: 'own' | 'shared';
}

export default function Bookmarks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedFolder, selectedTag]);

  async function loadData() {
    try {
      const [bookmarksRes, foldersRes, tagsRes, teamsRes] = await Promise.all([
        api.get('/bookmarks', { params: { folder_id: selectedFolder || undefined, tag_id: selectedTag || undefined } }),
        api.get('/folders'),
        api.get('/tags'),
        api.get('/teams'),
      ]);
      setBookmarks(bookmarksRes.data);
      setFolders(foldersRes.data);
      setTags(tagsRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingBookmark(null);
    setModalOpen(true);
  }

  function handleEdit(bookmark: Bookmark) {
    setEditingBookmark(bookmark);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm(t('bookmarks.deleteConfirm'))) return;
    try {
      await api.delete(`/bookmarks/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  }

  function handleCopyUrl(bookmark: Bookmark) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${user?.user_key}/${bookmark.slug}`;
    navigator.clipboard.writeText(url);
    alert(t('bookmarks.copied'));
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingBookmark(null);
    loadData();
  }

  const folderOptions = [
    { value: '', label: t('bookmarks.allFolders') },
    ...folders.map((f) => ({ value: f.id, label: f.name, icon: (f as any).icon })),
  ];

  const tagOptions = [
    { value: '', label: t('bookmarks.allTags') },
    ...tags.map((t) => ({ value: t.id, label: t.name })),
  ];

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
            {t('bookmarks.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
          </p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          {t('bookmarks.create')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Select
            value={selectedFolder}
            onChange={setSelectedFolder}
            options={folderOptions}
            placeholder={t('bookmarks.filterByFolder')}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Select
            value={selectedTag}
            onChange={setSelectedTag}
            options={tagOptions}
            placeholder={t('bookmarks.filterByTag')}
          />
        </div>
      </div>

      {/* Bookmarks Grid */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t('bookmarks.empty')}</p>
          <Button onClick={handleCreate} variant="primary" size="sm" icon={Plus}>
            {t('bookmarks.create')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
            >
              <div className="p-4 space-y-3">
                {/* Header with icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden">
                    <Favicon url={bookmark.url} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {bookmark.title}
                    </h3>
                    {bookmark.bookmark_type === 'shared' && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        <Share2 className="h-3 w-3" />
                        {t('bookmarks.shared')}
                      </span>
                    )}
                  </div>
                </div>

                {/* URL - minimal */}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{bookmark.url}</span>
                </p>

                {/* Tags & Folders - compact */}
                {((bookmark.folders && bookmark.folders.length > 0) || (bookmark.tags && bookmark.tags.length > 0) || (bookmark.shared_teams && bookmark.shared_teams.length > 0)) && (
                  <div className="flex flex-wrap gap-1.5">
                    {bookmark.folders?.slice(0, 2).map((folder) => (
                      <span
                        key={folder.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                      >
                        <FolderIcon iconName={folder.icon} size={12} className="text-blue-700 dark:text-blue-300" />
                        {folder.name}
                      </span>
                    ))}
                    {bookmark.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded"
                      >
                        <TagIcon className="h-3 w-3" />
                        {tag.name}
                      </span>
                    ))}
                    {bookmark.shared_teams && bookmark.shared_teams.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded">
                        <Share2 className="h-3 w-3" />
                        {bookmark.shared_teams.length}
                      </span>
                    )}
                  </div>
                )}

                {/* Forwarding URL - minimal */}
                {bookmark.forwarding_enabled && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700">
                    <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate flex-1">
                      /{bookmark.slug}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(bookmark)}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                      title={t('bookmarks.copyUrl')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Actions - minimal */}
                <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="primary" size="sm" icon={ExternalLink} className="w-full text-xs">
                      {t('bookmarks.open')}
                    </Button>
                  </a>
                  {bookmark.bookmark_type === 'own' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEdit(bookmark)}
                        title={t('common.edit')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(bookmark.id)}
                        title={t('common.delete')}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BookmarkModal
        bookmark={editingBookmark}
        folders={folders}
        tags={tags}
        teams={teams}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onTagCreated={(newTag) => {
          // Add the newly created tag to the tags list
          setTags([...tags, newTag]);
        }}
      />
    </div>
  );
}
