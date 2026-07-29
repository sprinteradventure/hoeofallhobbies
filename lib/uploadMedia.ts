import { supabase } from '@/lib/supabase/client'

// ============================================================================
// Direct-to-storage uploads (client-side helper).
// Large media can't be proxied through Vercel API routes (~4.5 MB body cap),
// so /api/upload/sign mints a signed upload URL and the browser PUTs the
// bytes straight to Supabase Storage — no service key client-side.
// ============================================================================

const BUCKET = 'product-images'

type SignedUpload = {
  path: string
  token: string
  signedUrl: string
  publicUrl: string
}

async function mintSignedUpload(kind: 'image' | 'video', file: File): Promise<SignedUpload> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Please sign in again to upload media.')

  const res = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ kind, contentType: file.type }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.path || !data?.token) {
    throw new Error(data?.error || 'Could not prepare the upload. Please try again.')
  }
  return data as SignedUpload
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
  const signed = await mintSignedUpload(kind, file)

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
