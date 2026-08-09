import { supabase } from '@/lib/supabase/client'
import { processListingImage } from '@/lib/imagePipeline'

// ============================================================================
// Direct-to-storage uploads (client-side helper).
// Large media can't be proxied through Vercel API routes (~4.5 MB body cap),
// so /api/upload/sign mints a signed upload URL and the browser PUTs the
// bytes straight to Supabase Storage — no service key client-side.
//
// Images are compressed in the browser first (lib/imagePipeline.ts) and
// uploaded as TWO variants sharing one UUID base name — the <=1600px main
// file plus a <=480px `_thumb.webp` — so any original URL maps to its
// thumbnail by suffix (see lib/imageThumb.ts). products.images stores the
// main/original URLs only.
// ============================================================================

const BUCKET = 'product-images'

type SignedUpload = {
  path: string
  token: string
  signedUrl: string
  publicUrl: string
}

async function mintSignedUpload(
  kind: 'image' | 'video',
  contentType: string,
  fileName?: string
): Promise<SignedUpload> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Please sign in again to upload media.')

  const res = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ kind, contentType, ...(fileName ? { fileName } : {}) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.path || !data?.token) {
    throw new Error(data?.error || 'Could not prepare the upload. Please try again.')
  }
  return data as SignedUpload
}

async function putToSignedUrl(signed: SignedUpload, blob: Blob, contentType: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, blob, { contentType })
  if (error) throw new Error('Upload failed. Please try again.')
}

/**
 * Upload a listing image: compress in the browser, upload the main variant
 * plus its `_thumb.webp` thumbnail, and return the main variant's public URL.
 */
async function uploadImage(file: File): Promise<string> {
  const processed = await processListingImage(file)
  const baseName = crypto.randomUUID()

  const signed = await mintSignedUpload('image', processed.mainType, `${baseName}.${processed.mainExt}`)
  await putToSignedUrl(signed, processed.main, processed.mainType)

  // Thumbnail is best-effort: if it fails, ListingImage's onError fallback
  // serves the main image in card contexts instead.
  if (processed.thumb) {
    try {
      const thumbSigned = await mintSignedUpload('image', 'image/webp', `${baseName}_thumb.webp`)
      await putToSignedUrl(thumbSigned, processed.thumb, 'image/webp')
    } catch (err) {
      console.warn('[upload] thumbnail upload failed; continuing without it', err)
    }
  }

  return signed.publicUrl
}

/**
 * Upload a File directly to Supabase Storage via a signed URL and return its
 * public URL. Pass onProgress (0-100) for large files (video).
 */
export async function uploadToStorage(
  kind: 'image' | 'video',
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (kind === 'image' && !onProgress) {
    return uploadImage(file)
  }

  const signed = await mintSignedUpload(kind, file.type)

  if (!onProgress) {
    // Small files: use the storage client helper (handles URL details).
    const { error } = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(signed.path, signed.token, file)
    if (error) throw new Error('Upload failed. Please try again.')
    return signed.publicUrl
  }

  // Large files: XHR PUT so we get real upload progress events.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const target = signed.signedUrl.startsWith('http')
    ? signed.signedUrl
    : `${supabaseUrl}${signed.signedUrl}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', target)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error('Upload failed. Please try again.'))
    }
    xhr.onerror = () => reject(new Error('Upload failed. Please check your connection and try again.'))
    xhr.send(file)
  })

  return signed.publicUrl
}
