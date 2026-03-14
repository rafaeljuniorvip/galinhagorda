/**
 * Get optimized image URL variant from an upload URL.
 * Works with both old format (uuid.jpg) and new format (uuid.webp with variants).
 *
 * @param url - Original image URL (e.g., /uploads/news/uuid.webp or /uploads/news/uuid_medium.webp)
 * @param variant - Desired variant: 'thumb' (400px), 'medium' (800px), 'full' (1400px), 'original'
 * @returns The variant URL, or original URL if not an upload path
 */
export function imageUrl(url: string | null | undefined, variant: 'thumb' | 'medium' | 'full' | 'original' = 'medium'): string {
  if (!url) return '';
  if (!url.startsWith('/uploads/')) return url;

  // Extract base filename without variant suffix and extension
  // Patterns: uuid.webp, uuid.jpg, uuid_thumb.webp, uuid_medium.webp, uuid_full.webp
  const match = url.match(/^(\/uploads\/[^/]+\/)([a-f0-9-]+?)(?:_(thumb|medium|full))?\.(webp|jpg|jpeg|png)$/);
  if (!match) return url;

  const [, dir, baseId, , ] = match;

  if (variant === 'original') {
    return `${dir}${baseId}.webp`;
  }

  return `${dir}${baseId}_${variant}.webp`;
}
