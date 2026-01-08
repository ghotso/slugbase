/**
 * Get favicon URL for a given website URL
 * Tries multiple methods to get the favicon
 */
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;
    
    // Try common favicon locations
    return `${origin}/favicon.ico`;
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Fetch favicon with fallback handling
 * Returns a data URL or empty string if fetch fails
 */
export async function fetchFavicon(url: string): Promise<string> {
  const faviconUrl = getFaviconUrl(url);
  if (!faviconUrl) return '';

  try {
    // Use a proxy service to fetch favicon to avoid CORS issues
    // Google's favicon service is reliable and doesn't require CORS
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}
