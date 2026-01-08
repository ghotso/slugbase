import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark, Folder, Tag } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('app.name')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('app.tagline')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          to="/bookmarks"
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bookmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('bookmarks.title')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.bookmarksDescription')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/folders"
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Folder className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('folders.title')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.foldersDescription')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/tags"
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('tags.title')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('dashboard.tagsDescription')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
