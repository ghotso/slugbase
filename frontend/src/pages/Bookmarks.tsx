import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { Plus, Edit, Trash2, Copy, ExternalLink, Share2, Tag as TagIcon } from 'lucide-react';
import BookmarkModal from '../components/modals/BookmarkModal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Tooltip from '../components/ui/Tooltip';
import Favicon from '../components/Favicon';
import FolderIcon from '../components/FolderIcon';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folders?: Array<{ id: string; name: string; icon?: string | null; shared_teams?: Array<{ id: string; name: string }>; shared_users?: Array<{ id: string; name: string; email: string }> }>;
  tags?: Array<{ id: string; name: string }>;
  shared_teams?: Array<{ id: string; name: string }>;
  shared_users?: Array<{ id: string; name: string; email: string }>;
  bookmark_type?: 'own' | 'shared';
}

export default function Bookmarks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showConfirm, dialogState } = useConfirmDialog();
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedFolder = searchParams.get('folder_id') || '';
  const selectedTag = searchParams.get('tag_id') || '';
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
      // Filter to only show own bookmarks (not shared)
      const ownBookmarks = bookmarksRes.data.filter((b: Bookmark) => b.bookmark_type === 'own');
      setBookmarks(ownBookmarks);
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

  function handleDelete(id: string) {
    showConfirm(
      t('bookmarks.deleteBookmark'),
      t('bookmarks.deleteConfirm'),
      async () => {
        try {
          await api.delete(`/bookmarks/${id}`);
          loadData();
        } catch (error) {
          console.error('Failed to delete bookmark:', error);
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
  }

  function handleCopyUrl(bookmark: Bookmark) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${user?.user_key}/${bookmark.slug}`;
    navigator.clipboard.writeText(url);
    showToast(t('bookmarks.copied'), 'success');
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
            {bookmarks.length} {bookmarks.length === 1 ? t('common.bookmark') : t('common.bookmarks')}
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
            onChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) {
                params.set('folder_id', value);
              } else {
                params.delete('folder_id');
              }
              setSearchParams(params);
            }}
            options={folderOptions}
            placeholder={t('bookmarks.filterByFolder')}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Select
            value={selectedTag}
            onChange={(value) => {
              const params = new URLSearchParams(searchParams);
              if (value) {
                params.set('tag_id', value);
              } else {
                params.delete('tag_id');
              }
              setSearchParams(params);
            }}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                {/* Header with icon and title */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 overflow-hidden">
                    <Favicon url={bookmark.url} size={24} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5">
                      {bookmark.title}
                    </h3>
                    {((bookmark.shared_teams && bookmark.shared_teams.length > 0) || 
                      (bookmark.folders && bookmark.folders.some(f => (f.shared_teams && f.shared_teams.length > 0) || (f.shared_users && f.shared_users.length > 0)))) && (
                      <Tooltip
                        content={
                          <div className="space-y-1">
                            <div className="font-semibold mb-1">{t('bookmarks.sharedWith')}</div>
                            {bookmark.shared_teams && bookmark.shared_teams.map((team) => (
                              <div key={team.id} className="text-xs">
                                • {team.name}
                              </div>
                            ))}
                            {bookmark.shared_users && bookmark.shared_users.map((user) => (
                              <div key={user.id} className="text-xs">
                                • {user.name || user.email}
                              </div>
                            ))}
                            {bookmark.folders && bookmark.folders.map((folder) => {
                              const hasShares = (folder.shared_teams && folder.shared_teams.length > 0) || (folder.shared_users && folder.shared_users.length > 0);
                              if (!hasShares) return null;
                              return (
                                <div key={folder.id} className="text-xs mt-1 pt-1 border-t border-gray-700">
                                  <div className="font-semibold mb-0.5">{folder.name}:</div>
                                  {folder.shared_teams && folder.shared_teams.map((team) => (
                                    <div key={team.id} className="text-xs pl-2">
                                      • {team.name}
                                    </div>
                                  ))}
                                  {folder.shared_users && folder.shared_users.map((user) => (
                                    <div key={user.id} className="text-xs pl-2">
                                      • {user.name || user.email}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        }
                      >
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800/50 cursor-help">
                          <Share2 className="h-3 w-3" />
                          {t('bookmarks.shared')}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* URL */}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 px-1">
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                  <span className="truncate">{bookmark.url}</span>
                </p>

                {/* Tags & Folders - Always show folder */}
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.folders && bookmark.folders.length > 0 ? (
                    bookmark.folders.slice(0, 2).map((folder) => (
                      <span
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchParams({ folder_id: folder.id });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <FolderIcon iconName={folder.icon} size={12} className="text-blue-700 dark:text-blue-300" />
                        {folder.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-800/50">
                      <FolderIcon iconName={null} size={12} className="text-gray-600 dark:text-gray-400" />
                      {t('bookmarks.noFolder')}
                    </span>
                  )}
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    bookmark.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800/50"
                      >
                        <TagIcon className="h-3 w-3" />
                        {tag.name}
                      </span>
                    ))
                  )}
                </div>

                {/* Forwarding URL */}
                {bookmark.forwarding_enabled && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    <code className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate flex-1">
                      /{bookmark.slug}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(bookmark)}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title={t('bookmarks.copyUrl')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50">
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
                        className="px-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(bookmark.id)}
                        title={t('common.delete')}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Engine Setup Guide Note */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('bookmarks.searchEngineNote')}{' '}
              <Link
                to="/search-engine-guide"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
              >
                {t('bookmarks.searchEngineGuideLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>

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

      <ConfirmDialog {...dialogState} />
    </div>
  );
}
