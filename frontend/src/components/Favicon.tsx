import { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { fetchFavicon } from '../utils/favicon';

interface FaviconProps {
  url: string;
  className?: string;
  size?: number;
}

export default function Favicon({ url, className = '', size = 20 }: FaviconProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (url) {
      setLoading(true);
      setError(false);
      fetchFavicon(url)
        .then((favicon) => {
          setFaviconUrl(favicon);
          setError(false);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [url]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
        <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !faviconUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
        <BookmarkIcon className="text-blue-600 dark:text-blue-400" style={{ width: `${size}px`, height: `${size}px` }} />
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className={`object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
