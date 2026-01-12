import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Bookmark, Folder, Tag, LogOut, Settings, Share2, Github } from 'lucide-react';
import Button from './ui/Button';

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: '/bookmarks', label: t('bookmarks.title'), icon: Bookmark },
    { path: '/folders', label: t('folders.title'), icon: Folder },
    { path: '/tags', label: t('tags.title'), icon: Tag },
    { path: '/shared', label: t('shared.title'), icon: Share2 },
    ...(user?.is_admin ? [{ path: '/admin', label: t('admin.title'), icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('app.name')}
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                {user?.name}
              </Link>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <a
              href="https://github.com/ghotso/slugbase"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
