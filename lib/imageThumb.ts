// ============================================================================
// Listing image URL helpers.
//
// Thumbnail convention (no schema change): for every image uploaded through
// lib/uploadMedia.ts, a 480px WebP thumbnail lives next to the original in
// the product-images bucket at the same base name with a `_thumb.webp`
// suffix:
//   .../product-images/<uid>/<uuid>.webp      -> original (<=1600px)
//   .../product-images/<uid>/<uuid>_thumb.webp -> thumbnail (<=480px)
// imageThumb() maps an original URL to its thumbnail; anything NOT hosted in
// our bucket (pasted external URLs, Cloudinary, Unsplash, legacy uploads from
// other buckets) is returned unchanged. Components must tolerate a thumb 404
// (pre-thumbnail-era uploads) by falling back to the original.
// ============================================================================

const BUCKET_MARKER = '/product-images/'
const THUMB_SUFFIX = '_thumb.webp'

export function imageThumb(url: string): string {
  if (!url || url.includes('_thumb.') || !url.includes(BUCKET_MARKER)) return url
  return url.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, THUMB_SUFFIX)
}

/**
 * Whether next/image is allowed to optimize this URL, mirroring
 * next.config.js (remotePatterns: **.supabase.co, **.cloudinary.com;
 * domains: localhost, images.unsplash.com). Arbitrary pasted external URLs
 * return false and should render as plain <img>.
 */
export function canOptimize(url: string): boolean {
  if (!url) return false
  if (url.startsWith('/')) return true
  try {
    const host = new URL(url).hostname
    return (
      host === 'localhost' ||
      host === 'images.unsplash.com' ||
      host.endsWith('supabase.co') ||
      host.endsWith('cloudinary.com')
    )
  } catch {
    return false
  }
}
