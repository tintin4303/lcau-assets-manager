/**
 * Handles image URLs and Google Drive links.
 * Automatically routes Google Drive files through our local proxy (/api/image/[id])
 * ensuring 100% reliable image loading without Google CDN 429/403 blocks.
 */

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // Format: /file/d/FILE_ID
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Format: ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Format: drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // Format: drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // If it is an internal proxy URL already: /api/image/FILE_ID
  const proxyMatch = url.match(/\/api\/image\/([a-zA-Z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  return null;
}

/**
 * Returns a reliable image URL for <img> tags.
 * For Google Drive files, routes through our high-performance /api/image proxy.
 */
export function getThumbnailUrl(raw: string, _size: 'sm' | 'lg' = 'sm'): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  // If it's a blob URL (local preview during file pick)
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If it is a Google Drive link, use our server proxy
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return `/api/image/${driveId}`;
  }

  // If it's an external web URL (e.g. Supabase, Imgur, direct https:// link)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

/**
 * Returns the full-resolution Google Drive file link for opening in a new tab.
 */
export function getDriveViewUrl(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

export function isImageUrl(raw: string): boolean {
  return getThumbnailUrl(raw) !== null;
}
