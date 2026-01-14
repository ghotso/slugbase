import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useToast } from '../components/ui/Toast';
import { Plus, Edit, Trash2, Copy, ExternalLink, Share2, Tag as TagIcon, LayoutGrid, List, X, CheckSquare, Square, Download, Upload, Bookmark as BookmarkIcon, FolderPlus } from 'lucide-react';
import BookmarkModal from '../components/modals/BookmarkModal';
import SharingModal from '../components/modals/SharingModal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import Autocomplete from '../components/ui/Autocomplete';
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
  created_at?: string;
  access_count?: number;
  last_accessed_at?: string;
  pinned?: boolean;
}

type ViewMode = 'card' | 'list';
type SortOption = 'recently_added' | 'alphabetical' | 'most_used' | 'recently_accessed';

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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('bookmarks-view-mode');
    return (saved === 'list' || saved === 'card') ? saved : 'card';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('bookmarks-compact-mode') === 'true';
  });
  const [sortBy, setSortBy] = useState<SortOption>('recently_added');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkMoveModalOpen, setBulkMoveModalOpen] = useState(false);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [bulkShareModalOpen, setBulkShareModalOpen] = useState(false);
  
  const selectedFolder = searchParams.get('folder_id') || '';
  const selectedTag = searchParams.get('tag_id') || '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedFolder, selectedTag]);

  useEffect(() => {
    localStorage.setItem('bookmarks-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('bookmarks-compact-mode', compactMode.toString());
  }, [compactMode]);

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

  const sortedBookmarks = useMemo(() => {
    const sorted = [...bookmarks];
    switch (sortBy) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'most_used':
        return sorted.sort((a, b) => (b.access_count || 0) - (a.access_count || 0));
      case 'recently_accessed':
        return sorted.sort((a, b) => {
          const aDate = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0;
          const bDate = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0;
          return bDate - aDate;
        });
      case 'recently_added':
      default:
        return sorted.sort((a, b) => {
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate;
        });
    }
  }, [bookmarks, sortBy]);

  const hasActiveFilters = selectedFolder || selectedTag;

  function handleCreate() {
    setEditingBookmark(null);
    setModalOpen(true);
  }

  function handleEdit(bookmark: Bookmark) {
    setEditingBookmark(bookmark);
    setModalOpen(true);
  }

  function handleDelete(id: string, name?: string) {
    const bookmark = bookmarks.find(b => b.id === id);
    const bookmarkName = name || bookmark?.title || 'this bookmark';
    showConfirm(
      t('bookmarks.deleteBookmark'),
      t('bookmarks.deleteConfirmWithName', { name: bookmarkName }),
      async () => {
        try {
          await api.delete(`/bookmarks/${id}`);
          loadData();
          setSelectedBookmarks(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          showToast(t('common.success'), 'success');
        } catch (error) {
          console.error('Failed to delete bookmark:', error);
          showToast(t('common.error'), 'error');
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
  }

  function handleBulkDelete() {
    const count = selectedBookmarks.size;
    showConfirm(
      t('bookmarks.deleteBookmark'),
      t('bookmarks.deleteConfirm').replace('this bookmark', `${count} bookmarks`),
      async () => {
        try {
          await Promise.all(Array.from(selectedBookmarks).map(id => api.delete(`/bookmarks/${id}`)));
          loadData();
          setSelectedBookmarks(new Set());
          setBulkMode(false);
          showToast(t('common.success'), 'success');
        } catch (error) {
          console.error('Failed to delete bookmarks:', error);
          showToast(t('common.error'), 'error');
        }
      },
      { variant: 'danger', confirmText: t('common.delete'), cancelText: t('common.cancel') }
    );
  }

  async function handleBulkMove(folderIds: string[]) {
    try {
      await Promise.all(Array.from(selectedBookmarks).map(id => 
        api.put(`/bookmarks/${id}`, { folder_ids: folderIds })
      ));
      loadData();
      setSelectedBookmarks(new Set());
      setBulkMoveModalOpen(false);
      showToast(t('common.success'), 'success');
    } catch (error) {
      console.error('Failed to move bookmarks:', error);
      showToast(t('common.error'), 'error');
    }
  }

  async function handleBulkAddTags(tagIds: string[]) {
    try {
      // Get current tags for each bookmark and merge
      const bookmarkPromises = Array.from(selectedBookmarks).map(async (id) => {
        const bookmark = bookmarks.find(b => b.id === id);
        const currentTagIds = bookmark?.tags?.map(t => t.id) || [];
        const mergedTagIds = [...new Set([...currentTagIds, ...tagIds])];
        return api.put(`/bookmarks/${id}`, { tag_ids: mergedTagIds });
      });
      await Promise.all(bookmarkPromises);
      loadData();
      setSelectedBookmarks(new Set());
      setBulkTagModalOpen(false);
      showToast(t('common.success'), 'success');
    } catch (error) {
      console.error('Failed to add tags:', error);
      showToast(t('common.error'), 'error');
    }
  }

  async function handleBulkShare(sharing: { team_ids: string[]; user_ids: string[]; share_all_teams: boolean }) {
    try {
      await Promise.all(Array.from(selectedBookmarks).map(id => 
        api.put(`/bookmarks/${id}`, {
          team_ids: sharing.team_ids,
          user_ids: sharing.user_ids,
          share_all_teams: sharing.share_all_teams,
        })
      ));
      loadData();
      setSelectedBookmarks(new Set());
      setBulkShareModalOpen(false);
      showToast(t('common.success'), 'success');
    } catch (error) {
      console.error('Failed to share bookmarks:', error);
      showToast(t('common.error'), 'error');
    }
  }

  function handleCopyUrl(bookmark: Bookmark) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${user?.user_key}/${bookmark.slug}`;
    navigator.clipboard.writeText(url);
    showToast(t('common.copied'), 'success');
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingBookmark(null);
    loadData();
  }

  function handleResetFilters() {
    setSearchParams({});
  }

  function toggleSelectBookmark(id: string) {
    setSelectedBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedBookmarks.size === sortedBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(sortedBookmarks.map(b => b.id)));
    }
  }

  const folderOptions = [
    { value: '', label: t('bookmarks.allFolders') },
    ...folders.map((f) => ({ value: f.id, label: f.name, icon: (f as any).icon })),
  ];

  const tagOptions = [
    { value: '', label: t('bookmarks.allTags') },
    ...tags.map((t) => ({ value: t.id, label: t.name })),
  ];

  const sortOptions = [
    { value: 'recently_added', label: t('bookmarks.sortRecentlyAdded') },
    { value: 'alphabetical', label: t('bookmarks.sortAlphabetical') },
    { value: 'most_used', label: t('bookmarks.sortMostUsed') },
    { value: 'recently_accessed', label: t('bookmarks.sortRecentlyAccessed') },
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('bookmarks.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {bookmarks.length} {bookmarks.length === 1 ? t('common.bookmark') : t('common.bookmarks')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Upload}
            onClick={() => {
              // TODO: Implement import functionality
              showToast('Import functionality coming soon', 'info');
            }}
            title={t('bookmarks.import')}
          >
            <span className="hidden sm:inline">{t('bookmarks.import')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={async () => {
              try {
                // Export as JSON
                const response = await api.get('/bookmarks');
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `slugbase-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast(t('common.success'), 'success');
              } catch (error) {
                console.error('Export failed:', error);
                showToast(t('common.error'), 'error');
              }
            }}
            title={t('bookmarks.export')}
          >
            <span className="hidden sm:inline">{t('bookmarks.export')}</span>
          </Button>
          <Button onClick={handleCreate} icon={Plus}>
            {t('bookmarks.create')}
          </Button>
        </div>
      </div>

      {/* Toolbar: Filters, Sort, View Modes */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 flex-1 min-w-[200px]">
          <div className="flex-1 min-w-[180px]">
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
          <div className="flex-1 min-w-[180px]">
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
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              icon={X}
              onClick={handleResetFilters}
            >
              {t('bookmarks.resetFilters')}
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as SortOption)}
            options={sortOptions}
            className="min-w-[160px]"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title={t('bookmarks.viewCard')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title={t('bookmarks.viewList')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setCompactMode(!compactMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              compactMode
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={t('bookmarks.compactMode')}
          >
            {t('bookmarks.compactMode')}
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {selectedBookmarks.size === sortedBookmarks.length ? t('bookmarks.deselectAll') : t('bookmarks.selectAll')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('bookmarks.selectedCount', { count: selectedBookmarks.size })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={FolderPlus}
              onClick={() => setBulkMoveModalOpen(true)}
              disabled={selectedBookmarks.size === 0}
            >
              {t('bookmarks.bulkMoveToFolder')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={TagIcon}
              onClick={() => setBulkTagModalOpen(true)}
              disabled={selectedBookmarks.size === 0}
            >
              {t('bookmarks.bulkAddTags')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Share2}
              onClick={() => setBulkShareModalOpen(true)}
              disabled={selectedBookmarks.size === 0}
            >
              {t('bookmarks.bulkShare')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleBulkDelete}
              disabled={selectedBookmarks.size === 0}
            >
              {t('bookmarks.bulkDelete')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBulkMode(false);
                setSelectedBookmarks(new Set());
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar Toggle */}
      {!bulkMode && sortedBookmarks.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={CheckSquare}
            onClick={() => setBulkMode(true)}
          >
            {t('bookmarks.bulkSelect')}
          </Button>
        </div>
      )}

      {/* Bookmarks Display */}
      {sortedBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <BookmarkIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.empty')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
            {t('bookmarks.emptyDescription')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleCreate} variant="primary" icon={Plus}>
              {t('bookmarks.emptyCreateFirst')}
            </Button>
            <Button variant="secondary" icon={Upload}>
              {t('bookmarks.emptyImport')}
            </Button>
            <Link to="/search-engine-guide">
              <Button variant="ghost" icon={ExternalLink}>
                {t('bookmarks.emptyLearnForwarding')}
              </Button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        <div className={`grid grid-cols-1 gap-4 ${
          compactMode 
            ? 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
            : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {sortedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              compact={compactMode}
              selected={selectedBookmarks.has(bookmark.id)}
              onSelect={() => toggleSelectBookmark(bookmark.id)}
              onEdit={() => handleEdit(bookmark)}
              onDelete={() => handleDelete(bookmark.id, bookmark.title)}
              onCopyUrl={() => handleCopyUrl(bookmark)}
              bulkMode={bulkMode}
              user={user}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBookmarks.map((bookmark) => (
            <BookmarkListItem
              key={bookmark.id}
              bookmark={bookmark}
              compact={compactMode}
              selected={selectedBookmarks.has(bookmark.id)}
              onSelect={() => toggleSelectBookmark(bookmark.id)}
              onEdit={() => handleEdit(bookmark)}
              onDelete={() => handleDelete(bookmark.id, bookmark.title)}
              onCopyUrl={() => handleCopyUrl(bookmark)}
              bulkMode={bulkMode}
              user={user}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Search Engine Setup Guide Note */}
      {sortedBookmarks.length > 0 && (
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
      )}

      <BookmarkModal
        bookmark={editingBookmark}
        folders={folders}
        tags={tags}
        teams={teams}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onTagCreated={(newTag) => {
          setTags([...tags, newTag]);
        }}
      />

      {/* Bulk Move Modal */}
      {bulkMoveModalOpen && (
        <BulkMoveModal
          isOpen={bulkMoveModalOpen}
          onClose={() => setBulkMoveModalOpen(false)}
          onSave={handleBulkMove}
          folders={folders}
          t={t}
        />
      )}

      {/* Bulk Tag Modal */}
      {bulkTagModalOpen && (
        <BulkTagModal
          isOpen={bulkTagModalOpen}
          onClose={() => setBulkTagModalOpen(false)}
          onSave={handleBulkAddTags}
          tags={tags}
          onTagCreated={(newTag) => setTags([...tags, newTag])}
          t={t}
        />
      )}

      {/* Bulk Share Modal */}
      {bulkShareModalOpen && (
        <BulkShareModal
          isOpen={bulkShareModalOpen}
          onClose={() => setBulkShareModalOpen(false)}
          onSave={handleBulkShare}
          teams={teams}
        />
      )}

      <ConfirmDialog {...dialogState} />
    </div>
  );
}

// Bulk Move Modal Component
function BulkMoveModal({
  isOpen,
  onClose,
  onSave,
  folders,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderIds: string[]) => void;
  folders: Array<{ id: string; name: string }>;
  t: any;
}) {
  const [selectedFolders, setSelectedFolders] = useState<Array<{ id: string; name: string }>>([]);

  function handleSave() {
    onSave(selectedFolders.map(f => f.id));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bookmarks.bulkMoveToFolder')} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.folders')}
          </label>
          <Autocomplete
            value={selectedFolders}
            onChange={setSelectedFolders}
            options={folders}
            placeholder={t('bookmarks.foldersDescription')}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Bulk Tag Modal Component
function BulkTagModal({
  isOpen,
  onClose,
  onSave,
  tags,
  onTagCreated,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tagIds: string[]) => void;
  tags: Array<{ id: string; name: string }>;
  onTagCreated?: (tag: { id: string; name: string }) => void;
  t: any;
}) {
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string }>>([]);

  async function handleCreateTag(name: string): Promise<{ id: string; name: string } | null> {
    try {
      const response = await api.post('/tags', { name });
      const newTag = { id: response.data.id, name: response.data.name };
      if (onTagCreated) {
        onTagCreated(newTag);
      }
      return newTag;
    } catch {
      return null;
    }
  }

  function handleSave() {
    onSave(selectedTags.map(t => t.id));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bookmarks.bulkAddTags')} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {t('bookmarks.tags')}
          </label>
          <Autocomplete
            value={selectedTags}
            onChange={setSelectedTags}
            options={tags}
            placeholder={t('bookmarks.tags')}
            onCreateNew={handleCreateTag}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Bulk Share Modal Component
function BulkShareModal({
  isOpen,
  onClose,
  onSave,
  teams,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sharing: { team_ids: string[]; user_ids: string[]; share_all_teams: boolean }) => void;
  teams: Array<{ id: string; name: string }>;
}) {
  return (
    <SharingModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      currentShares={{
        team_ids: [],
        user_ids: [],
        share_all_teams: false,
      }}
      teams={teams}
      type="bookmark"
    />
  );
}

// Bookmark Card Component
function BookmarkCard({
  bookmark,
  compact,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onCopyUrl,
  bulkMode,
  user: _user,
  t,
}: {
  bookmark: Bookmark;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  bulkMode: boolean;
  user: any;
  t: any;
}) {
  const totalSharedTeams = (bookmark.shared_teams?.length || 0) + 
    (bookmark.folders?.reduce((sum, f) => sum + (f.shared_teams?.length || 0), 0) || 0);
  const totalSharedUsers = (bookmark.shared_users?.length || 0) + 
    (bookmark.folders?.reduce((sum, f) => sum + (f.shared_users?.length || 0), 0) || 0);
  const isShared = totalSharedTeams > 0 || totalSharedUsers > 0;

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-xl border ${
        selected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
      } hover:shadow-lg transition-all duration-200 flex flex-col ${compact ? 'p-3' : 'p-5'}`}
    >
      <div className={`space-y-3 flex-1 flex flex-col ${compact ? 'space-y-2' : ''}`}>
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          {bulkMode && (
            <button
              onClick={onSelect}
              className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
            >
              {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
            </button>
          )}
          <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 overflow-hidden`}>
            <Favicon url={bookmark.url} size={compact ? 20 : 24} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1.5`}>
              {bookmark.title}
            </h3>
            {isShared && (
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
                  {totalSharedTeams > 0 
                    ? t('bookmarks.sharedWithTeams', { count: totalSharedTeams, teams: totalSharedTeams === 1 ? t('common.team') : t('common.teams') })
                    : t('bookmarks.shared')}
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        {/* URL */}
        <p className={`${compact ? 'text-xs' : 'text-xs'} text-gray-600 dark:text-gray-300 truncate flex items-center gap-1.5 px-1`}>
          <ExternalLink className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} flex-shrink-0 opacity-70`} />
          <span className="truncate">{bookmark.url}</span>
        </p>

        {/* Tags & Folders */}
        <div className="flex flex-wrap gap-1.5">
          {bookmark.folders && bookmark.folders.length > 0 ? (
            bookmark.folders.slice(0, 2).map((folder) => (
              <span
                key={folder.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 ${compact ? 'text-xs' : 'text-xs'} font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/50`}
              >
                <FolderIcon iconName={folder.icon} size={12} className="text-blue-700 dark:text-blue-300" />
                {folder.name}
              </span>
            ))
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${compact ? 'text-xs' : 'text-xs'} font-medium bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-800/50`}>
              <FolderIcon iconName={null} size={12} className="text-gray-600 dark:text-gray-400" />
              {t('bookmarks.noFolder')}
            </span>
          )}
          {bookmark.tags && bookmark.tags.length > 0 && (
            bookmark.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 ${compact ? 'text-xs' : 'text-xs'} font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800/50`}
              >
                <TagIcon className="h-3 w-3" />
                {tag.name}
              </span>
            ))
          )}
        </div>

        {/* Forwarding URL */}
        {bookmark.forwarding_enabled && (
          <div className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700`}>
            <code className={`${compact ? 'text-xs' : 'text-xs'} font-mono text-gray-700 dark:text-gray-300 truncate flex-1`}>
              /{bookmark.slug}
            </code>
            <button
              onClick={onCopyUrl}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('bookmarks.copyUrl')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className={`flex gap-2 pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50 ${compact ? 'pt-2' : ''}`}>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="primary" size="sm" icon={ExternalLink} className={`w-full ${compact ? 'text-xs px-2 py-1' : 'text-xs'}`}>
              {t('bookmarks.open')}
            </Button>
          </a>
          {bookmark.bookmark_type === 'own' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                onClick={onEdit}
                title={t('common.edit')}
                className={`${compact ? 'px-1.5' : 'px-2'}`}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={onDelete}
                title={t('common.delete')}
                className={`text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ${compact ? 'px-1.5' : 'px-2'}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Bookmark List Item Component
function BookmarkListItem({
  bookmark,
  compact,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onCopyUrl,
  bulkMode,
  user,
  t,
}: {
  bookmark: Bookmark;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  bulkMode: boolean;
  user: any;
  t: any;
}) {
  const totalSharedTeams = (bookmark.shared_teams?.length || 0) + 
    (bookmark.folders?.reduce((sum, f) => sum + (f.shared_teams?.length || 0), 0) || 0);
  const isShared = totalSharedTeams > 0;

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-lg border ${
        selected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
      } hover:shadow transition-all duration-200 ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center gap-4">
        {bulkMode && (
          <button
            onClick={onSelect}
            className="flex-shrink-0 text-blue-600 dark:text-blue-400"
          >
            {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          </button>
        )}
        <div className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 overflow-hidden`}>
          <Favicon url={bookmark.url} size={compact ? 20 : 24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white mb-1`}>
                {bookmark.title}
              </h3>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 truncate mb-2`}>
                {bookmark.url}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {bookmark.folders && bookmark.folders.length > 0 && (
                  bookmark.folders.slice(0, 1).map((folder) => (
                    <span
                      key={folder.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 ${compact ? 'text-xs' : 'text-xs'} font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md`}
                    >
                      <FolderIcon iconName={folder.icon} size={12} />
                      {folder.name}
                    </span>
                  ))
                )}
                {bookmark.tags && bookmark.tags.length > 0 && (
                  bookmark.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 ${compact ? 'text-xs' : 'text-xs'} font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md`}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag.name}
                    </span>
                  ))
                )}
                {isShared && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                    <Share2 className="h-3 w-3" />
                    {totalSharedTeams > 0 
                      ? t('bookmarks.sharedWithTeams', { count: totalSharedTeams, teams: totalSharedTeams === 1 ? t('common.team') : t('common.teams') })
                      : t('bookmarks.shared')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {bookmark.forwarding_enabled && (
                <Tooltip content={`${window.location.origin}/${user?.user_key}/${bookmark.slug}`}>
                  <button
                    onClick={onCopyUrl}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={t('bookmarks.copyUrl')}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="sm" icon={ExternalLink} className={compact ? 'text-xs px-2' : ''}>
                  {t('bookmarks.open')}
                </Button>
              </a>
              {bookmark.bookmark_type === 'own' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={onEdit}
                    title={t('common.edit')}
                    className="px-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={onDelete}
                    title={t('common.delete')}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

