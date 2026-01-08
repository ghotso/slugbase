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

  useEffect(() => {
    if (url) {
      fetchFavicon(url)
        .then((favicon) => {
          setFaviconUrl(favicon);
          setError(false);
        })
        .catch(() => {
          setError(true);
        });
    }
  }, [url]);

  if (error || !faviconUrl) {
    return (
      <div className={className}>
        <BookmarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
      onError={() => setError(true)}
    />
  );
}
