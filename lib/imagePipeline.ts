// ============================================================================
// Browser-side listing image pipeline (client-only — uses canvas).
// Turns multi-MB phone photos into small WebP files BEFORE upload:
//   * main  — max 1600px long edge, WebP ~82% (JPEG ~85% fallback when the
//             browser can't encode WebP). Skipped for GIFs (animation) and
//             files already under ~300 KB, and reverted if the re-encode ends
//             up larger than the source.
//   * thumb — max 480px long edge, WebP ~80%, uploaded as `<base>_thumb.webp`
//             (see lib/imageThumb.ts). Skipped for GIFs and for browsers
//             without WebP encode support; ListingImage falls back to the
//             original when a thumb is missing.
// ============================================================================

const MAX_MAIN_EDGE = 1600
const MAX_THUMB_EDGE = 480
const SKIP_COMPRESS_BYTES = 300 * 1024
const MAIN_WEBP_QUALITY = 0.82
const MAIN_JPEG_QUALITY = 0.85
const THUMB_WEBP_QUALITY = 0.8

export interface ProcessedImage {
  /** Bytes for the primary variant (original file or compressed blob). */
  main: Blob
  /** Extension for the primary variant: webp | jpg | png | gif. */
  mainExt: string
  /** MIME type for the primary variant. */
  mainType: string
  /** 480px WebP thumbnail bytes, or null when none should be uploaded. */
  thumb: Blob | null
}

let webpSupportPromise: Promise<boolean> | null = null

function supportsWebpEncode(): Promise<boolean> {
  if (!webpSupportPromise) {
    webpSupportPromise = new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        canvas.toBlob(
          (blob) => resolve(blob?.type === 'image/webp'),
          'image/webp',
          0.5
        )
      } catch {
        resolve(false)
      }
    })
  }
  return webpSupportPromise
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // Honors EXIF orientation where supported.
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not read the image file.'))
      }
      img.src = objectUrl
    })
  }
}

function dimensions(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if (source instanceof ImageBitmap) {
    return { width: source.width, height: source.height }
  }
  return { width: source.naturalWidth, height: source.naturalHeight }
}

function encode(
  source: ImageBitmap | HTMLImageElement,
  maxEdge: number,
  type: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob | null> {
  const { width, height } = dimensions(source)
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function extForType(type: string): string {
  switch (type) {
    case 'image/png': return 'png'
    case 'image/gif': return 'gif'
    case 'image/webp': return 'webp'
    default: return 'jpg'
  }
}

export async function processListingImage(file: File): Promise<ProcessedImage> {
  // GIFs keep their animation — no compression, no thumbnail.
  if (file.type === 'image/gif') {
    return { main: file, mainExt: 'gif', mainType: file.type, thumb: null }
  }

  const webpOk = await supportsWebpEncode()

  let source: ImageBitmap | HTMLImageElement
  try {
    source = await loadBitmap(file)
  } catch {
    // Unreadable as an image — upload untouched rather than blocking the seller.
    return { main: file, mainExt: extForType(file.type), mainType: file.type, thumb: null }
  }

  // --- Main variant ---------------------------------------------------------
  let main: Blob = file
  let mainExt = extForType(file.type)
  let mainType = file.type

  const { width, height } = dimensions(source)
  const needsResize = Math.max(width, height) > MAX_MAIN_EDGE
  const needsCompress = file.size > SKIP_COMPRESS_BYTES

  if (needsResize || needsCompress) {
    const compressed = webpOk
      ? await encode(source, MAX_MAIN_EDGE, 'image/webp', MAIN_WEBP_QUALITY)
      : await encode(source, MAX_MAIN_EDGE, 'image/jpeg', MAIN_JPEG_QUALITY)
    // Keep the original if re-encoding failed or made things bigger.
    if (compressed && compressed.size < file.size) {
      main = compressed
      mainExt = webpOk ? 'webp' : 'jpg'
      mainType = webpOk ? 'image/webp' : 'image/jpeg'
    }
  }

  // --- Thumbnail variant ----------------------------------------------------
  // WebP-only so the `_thumb.webp` URL convention stays deterministic; when
  // WebP encode is unavailable the onError fallback serves the original.
  let thumb: Blob | null = null
  if (webpOk) {
    thumb = await encode(source, MAX_THUMB_EDGE, 'image/webp', THUMB_WEBP_QUALITY)
  }

  if (source instanceof ImageBitmap) source.close()

  return { main, mainExt, mainType, thumb }
}
