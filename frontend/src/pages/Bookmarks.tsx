import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { Plus, Edit, Trash2, Copy, ExternalLink } from 'lucide-react';
import BookmarkModal from '../components/BookmarkModal';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folder?: { id: string; name: string };
  tags?: Array<{ id: string; name: string }>;
}

export default function Bookmarks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
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
      const [bookmarksRes, foldersRes, tagsRes] = await Promise.all([
        api.get('/bookmarks', { params: { folder_id: selectedFolder || undefined, tag_id: selectedTag || undefined } }),
        api.get('/folders'),
        api.get('/tags'),
      ]);
      setBookmarks(bookmarksRes.data);
      setFolders(foldersRes.data);
      setTags(tagsRes.data);
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

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('bookmarks.title')}
        </h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bookmarks.create')}
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="block rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">{t('bookmarks.allFolders')}</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="block rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">{t('bookmarks.allTags')}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('bookmarks.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {bookmark.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
                  {bookmark.url}
                </p>
                {bookmark.folder && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mr-2">
                    {bookmark.folder.name}
                  </span>
                )}
                {bookmark.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded mr-2"
                  >
                    {tag.name}
                  </span>
                ))}
                {bookmark.forwarding_enabled && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {window.location.origin}/{user?.user_key}/{bookmark.slug}
                    </span>
                    <button
                      onClick={() => handleCopyUrl(bookmark)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      title={t('bookmarks.copyUrl')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('bookmarks.open')}
                  </a>
                  <button
                    onClick={() => handleEdit(bookmark)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <BookmarkModal
          bookmark={editingBookmark}
          folders={folders}
          tags={tags}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
