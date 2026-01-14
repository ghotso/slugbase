import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, Bookmark, Folder, Tag, ExternalLink } from 'lucide-react';
import api from '../api/client';

interface SearchResult {
  id: string;
  type: 'bookmark' | 'folder' | 'tag';
  title: string;
  url?: string;
  icon?: string | null;
}

export default function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchLower = query.toLowerCase();
        const [bookmarksRes, foldersRes, tagsRes] = await Promise.all([
          api.get('/bookmarks'),
          api.get('/folders'),
          api.get('/tags'),
        ]);

        const bookmarkResults: SearchResult[] = bookmarksRes.data
          .filter((b: any) => 
            b.title.toLowerCase().includes(searchLower) ||
            b.url.toLowerCase().includes(searchLower) ||
            (b.slug && b.slug.toLowerCase().includes(searchLower))
          )
          .slice(0, 5)
          .map((b: any) => ({
            id: b.id,
            type: 'bookmark' as const,
            title: b.title,
            url: b.url,
          }));

        const folderResults: SearchResult[] = foldersRes.data
          .filter((f: any) => f.name.toLowerCase().includes(searchLower))
          .slice(0, 3)
          .map((f: any) => ({
            id: f.id,
            type: 'folder' as const,
            title: f.name,
            icon: f.icon,
          }));

        const tagResults: SearchResult[] = tagsRes.data
          .filter((t: any) => t.name.toLowerCase().includes(searchLower))
          .slice(0, 3)
          .map((t: any) => ({
            id: t.id,
            type: 'tag' as const,
            title: t.name,
          }));

        setResults([...bookmarkResults, ...folderResults, ...tagResults]);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, isOpen]);

  function handleResultClick(result: SearchResult) {
    setIsOpen(false);
    setQuery('');
    setResults([]);

    if (result.type === 'bookmark') {
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      }
    } else if (result.type === 'folder') {
      navigate(`/bookmarks?folder_id=${result.id}`);
    } else if (result.type === 'tag') {
      navigate(`/bookmarks?tag_id=${result.id}`);
    }
  }

  function getResultIcon(result: SearchResult) {
    switch (result.type) {
      case 'bookmark':
        return <Bookmark className="h-4 w-4" />;
      case 'folder':
        return <Folder className="h-4 w-4" />;
      case 'tag':
        return <Tag className="h-4 w-4" />;
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
      >
        <Search className="h-4 w-4" />
        <span>{t('common.search')}</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </div>
          ) : results.length === 0 && query ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {t('common.noResults')}
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                    {getResultIcon(result)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </div>
                    {result.url && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {result.url}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('common.searchPlaceholder')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Enter</kbd>
                <span>Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd>
              <span>Close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
