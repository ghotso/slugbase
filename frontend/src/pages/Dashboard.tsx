import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Bookmark, Folder, Tag, ArrowRight, Share2, Clock, TrendingUp } from 'lucide-react';
import api from '../api/client';

interface DashboardStats {
  totalBookmarks: number;
  totalFolders: number;
  totalTags: number;
  sharedBookmarks: number;
  sharedFolders: number;
  recentBookmarks: Array<{ id: string; title: string; url: string; created_at: string }>;
  topTags: Array<{ id: string; name: string; bookmark_count: number }>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }

  const cards = [
    {
      to: '/bookmarks',
      icon: Bookmark,
      title: t('bookmarks.title'),
      description: t('dashboard.bookmarksDescription'),
      color: 'blue',
    },
    {
      to: '/folders',
      icon: Folder,
      title: t('folders.title'),
      description: t('dashboard.foldersDescription'),
      color: 'green',
    },
    {
      to: '/tags',
      icon: Tag,
      title: t('tags.title'),
      description: t('dashboard.tagsDescription'),
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('app.name')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('app.tagline')}
        </p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.overview')}
          </h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalBookmarks')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalBookmarks}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Bookmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalFolders')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalFolders}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Folder className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalTags')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalTags}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.sharedBookmarks')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.sharedBookmarks}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Share2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('dashboard.sharedFolders')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.sharedFolders}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Share2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookmarks and Top Tags */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Bookmarks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.recentBookmarks')}
                </h3>
              </div>
              {stats.recentBookmarks.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentBookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                        {bookmark.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {bookmark.url}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('dashboard.noRecentBookmarks')}
                </p>
              )}
            </div>

            {/* Top Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.topTags')}
                </h3>
              </div>
              {stats.topTags.length > 0 ? (
                <div className="space-y-3">
                  {stats.topTags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/bookmarks?tag_id=${tag.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.bookmark_count} {tag.bookmark_count === 1 ? t('bookmarks.title').slice(0, -1) : t('bookmarks.title')}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('dashboard.noTags')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className={`inline-flex p-3 rounded-lg border ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t('common.view')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
