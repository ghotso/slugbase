import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark, Folder, Tag, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();

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
