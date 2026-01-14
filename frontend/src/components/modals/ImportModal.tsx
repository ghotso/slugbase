import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../api/client';
import { useToast } from '../ui/Toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      let bookmarks: any[] = [];

      if (file.name.endsWith('.json')) {
        // JSON import
        const data = JSON.parse(text);
        bookmarks = Array.isArray(data) ? data : [data];
      } else if (file.name.endsWith('.html')) {
        // HTML/Netscape bookmark format
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a');
        bookmarks = Array.from(links).map((link) => ({
          title: link.textContent || '',
          url: link.getAttribute('href') || '',
        }));
      } else {
        throw new Error('Unsupported file format. Please use JSON or HTML.');
      }

      if (bookmarks.length === 0) {
        throw new Error('No bookmarks found in file.');
      }

      const response = await api.post('/bookmarks/import', { bookmarks });
      showToast(
        t('bookmarks.importSuccess', { 
          success: response.data.success, 
          failed: response.data.failed 
        }),
        response.data.failed > 0 ? 'warning' : 'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('common.error'));
      showToast(err.response?.data?.error || err.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('bookmarks.import')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('bookmarks.importDescription')}
        </p>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json,.html"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
            <Button
              variant="primary"
              icon={Upload}
              disabled={loading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
            >
              {loading ? t('common.loading') : t('bookmarks.selectFile')}
            </Button>
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('bookmarks.supportedFormats')}
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
