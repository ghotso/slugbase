import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Share2, ExternalLink, Copy, Tag as TagIcon, Users, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Favicon from '../components/Favicon';
import FolderIcon from '../components/FolderIcon';

interface SharedBookmark {
  id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folders?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
  shared_teams?: Array<{ id: string; name: string }>;
  shared_users?: Array<{ id: string; name: string; email: string }>;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

interface SharedFolder {
  id: string;
  name: string;
  icon?: string | null;
  shared_teams?: Array<{ id: string; name: string }>;
  shared_users?: Array<{ id: string; name: string; email: string }>;
  user_id: string;
  user_name?: string;
  user_email?: string;
  bookmark_count?: number;
}

export default function Shared() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookmarks, setBookmarks] = useState<SharedBookmark[]>([]);
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'folders'>('bookmarks');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [bookmarksRes, foldersRes] = await Promise.all([
        api.get('/bookmarks'),
        api.get('/folders'),
      ]);
      
      // Filter to only shared items (not owned by current user)
      const sharedBookmarks = bookmarksRes.data.filter((b: SharedBookmark) => b.user_id !== user?.id);
      const sharedFolders = foldersRes.data.filter((f: SharedFolder) => f.user_id !== user?.id);
      
      setBookmarks(sharedBookmarks);
      setFolders(sharedFolders);
    } catch (error) {
      console.error('Failed to load shared data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyUrl(bookmark: SharedBookmark) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${bookmark.slug}`;
    navigator.clipboard.writeText(url);
    showToast(t('bookmarks.copied'), 'success');
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Share2 className="h-8 w-8" />
          {t('shared.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('shared.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'bookmarks'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('shared.bookmarks')} ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('folders')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'folders'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('shared.folders')} ({folders.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'bookmarks' ? (
        bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('shared.noBookmarks')}</p>
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
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        <Share2 className="h-3 w-3" />
                        {t('bookmarks.shared')}
                      </span>
                    </div>
                  </div>

                  {/* Shared by */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="truncate">{bookmark.user_name || bookmark.user_email || t('shared.unknownUser')}</span>
                  </div>

                  {/* URL - minimal */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{bookmark.url}</span>
                  </p>

                  {/* Tags & Folders - compact */}
                  {((bookmark.folders && bookmark.folders.length > 0) || (bookmark.tags && bookmark.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
                    {bookmark.folders?.slice(0, 2).map((folder) => (
                      <span
                        key={folder.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                      >
                        <FolderIcon iconName={(folder as any).icon} size={12} className="text-blue-700 dark:text-blue-300" />
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
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="primary" size="sm" icon={ExternalLink} className="w-full text-xs">
                        {t('bookmarks.open')}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('shared.noFolders')}</p>
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
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        <Share2 className="h-3 w-3" />
                        {t('folders.shared')}
                      </span>
                    </div>
                  </div>

                  {/* Shared by */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="truncate">{folder.user_name || folder.user_email || t('shared.unknownUser')}</span>
                  </div>

                  {/* Sharing info - compact */}
                  <div className="flex flex-wrap gap-1.5">
                    {folder.shared_teams && folder.shared_teams.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded">
                        <Users className="h-3 w-3" />
                        {folder.shared_teams.length}
                      </span>
                    )}
                    {folder.shared_users && folder.shared_users.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                        <User className="h-3 w-3" />
                        {folder.shared_users.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
