import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// ============================================================================
// SIGNED UPLOAD URLS — LIVE (Supabase Storage, direct-to-storage)
// ----------------------------------------------------------------------------
// POST /api/upload/sign
// Authorization: Bearer <supabase access token>
// Body: { kind: 'image' | 'video', contentType: string, fileName?: string, size?: number }
//
// Vercel serverless request bodies cap at ~4.5 MB, so large media cannot be
// proxied through an API route. Instead we mint a signed upload URL on the
// service-role client; the browser then PUTs the bytes straight to Supabase
// Storage (no key needed client-side). Sellers only.
//
// fileName is optional: when omitted a random UUID name is minted (legacy
// behavior). The client passes it to create deterministic thumbnail names
// (`<uuid>_thumb.webp` alongside `<uuid>.<ext>` — see lib/imageThumb.ts).
// It is validated and always stored under the seller's own folder.
// ============================================================================

const BUCKET = 'product-images'
// Digital download files (templates etc.) live in a SEPARATE PRIVATE bucket —
// they must never be in the public product-images bucket, where anyone with
// the URL could download a paid template without buying.
const DIGITAL_BUCKET = 'digital-files'

// R8: server-side size caps on what we sign for. Images are compressed
// client-side to <= 10 MB (ImageUploader); videos legitimately run larger,
// so they get their own 50 MB cap (VideoUploader) instead of a blanket 10 MB.
// Digital template files (PDF/ZIP/images) share the 50 MB cap.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const MAX_DIGITAL_BYTES = 50 * 1024 * 1024

// R6: signed-upload minting is throttled per user (30/hour).
const MAX_SIGN_PER_HOUR = 30

const ALLOWED: Record<'image' | 'video' | 'digital', Record<string, string>> = {
  image: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  },
  video: {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  },
  digital: {
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  },
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth: Bearer token, sellers only ------------------------------------
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to upload media.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to upload media.' }, { status: 401 })
    }
    const user = userData.user

    // R6: throttle signed-URL minting per user (each listing image can mint
    // two URLs — main + thumbnail — so 30/hour is comfortably generous).
    if (!rateLimit(`upload-sign:${user.id}`, MAX_SIGN_PER_HOUR, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_seller) {
      return NextResponse.json(
        { error: 'Only sellers can upload product media.' },
        { status: 403 }
      )
    }

    // --- Validate the requested upload ---------------------------------------
    const body = await request.json().catch(() => ({}))
    const kind =
      body?.kind === 'video' ? 'video' : body?.kind === 'image' ? 'image' : body?.kind === 'digital' ? 'digital' : null
    const contentType = typeof body?.contentType === 'string' ? body.contentType : ''

    if (!kind) {
      return NextResponse.json(
        { error: 'kind must be "image", "video", or "digital".' },
        { status: 400 }
      )
    }

    const ext = ALLOWED[kind][contentType]
    if (!ext) {
      const message =
        kind === 'video'
          ? 'Unsupported video type. Please use MP4, WebM, or MOV.'
          : kind === 'digital'
            ? 'Unsupported file type. Please use PDF, ZIP, PNG, JPG, WebP, or SVG.'
            : 'Unsupported image type. Please use JPEG, PNG, WebP, or GIF.'
      return NextResponse.json({ error: message }, { status: 415 })
    }

    // R8: enforce a server-side size cap on the upload we sign for. The
    // client declares its file size; anything over the cap is rejected
    // before a signed URL is minted (the PUT itself goes straight to
    // Storage, so this declaration is the only server-side lever).
    const size = body?.size
    if (size !== undefined && size !== null) {
      const bytes = typeof size === 'number' ? size : Number(size)
      const cap = kind === 'video' ? MAX_VIDEO_BYTES : kind === 'digital' ? MAX_DIGITAL_BYTES : MAX_IMAGE_BYTES
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return NextResponse.json({ error: 'Invalid size.' }, { status: 400 })
      }
      if (bytes > cap) {
        const message =
          kind === 'video'
            ? 'Videos must be 50 MB or smaller.'
            : kind === 'digital'
              ? 'Files must be 50 MB or smaller.'
              : 'Images must be 10 MB or smaller.'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // --- Ensure the bucket exists (tolerate already-exists) -------------------
    // Digital files live in a PRIVATE bucket; buyers only ever get a
    // short-lived signed URL from /api/downloads after their paid order is
    // verified server-side.
    if (kind === 'digital') {
      const { error: digitalBucketError } = await admin.storage.createBucket(DIGITAL_BUCKET)
      if (digitalBucketError) {
        const msg = (digitalBucketError.message || '').toLowerCase()
        const alreadyExists =
          msg.includes('already exists') || (digitalBucketError as any).statusCode === '409'
        if (!alreadyExists) throw digitalBucketError
      }
    } else {
      const { error: bucketError } = await admin.storage.createBucket(BUCKET, { public: true })
      if (bucketError) {
        const msg = (bucketError.message || '').toLowerCase()
        const alreadyExists =
          msg.includes('already exists') || (bucketError as any).statusCode === '409'
        if (!alreadyExists) throw bucketError
      }
    }

    // --- Mint the signed upload URL -------------------------------------------
    // Optional client-chosen file name (used for the `_thumb.webp` convention):
    // strict shape, and its extension must match the declared content type.
    let fileName: string | null = null
    if (typeof body?.fileName === 'string' && body.fileName) {
      const candidate = body.fileName
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,100}\.[a-z0-9]{2,5}$/.test(candidate)) {
        return NextResponse.json({ error: 'Invalid fileName.' }, { status: 400 })
      }
      if (!candidate.toLowerCase().endsWith(`.${ext}`)) {
        return NextResponse.json(
          { error: 'fileName extension must match the content type.' },
          { status: 400 }
        )
      }
      fileName = candidate
    }

    const path = `${user.id}/${fileName || `${crypto.randomUUID()}.${ext}`}`
    const bucket = kind === 'digital' ? DIGITAL_BUCKET : BUCKET
    const { data: signed, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (signError || !signed) throw signError || new Error('Failed to sign upload URL')

    // Digital files have no public URL — the private bucket only serves them
    // through the verified /api/downloads route.
    const publicUrl = kind === 'digital' ? null : admin.storage.from(bucket).getPublicUrl(path).data.publicUrl

    return NextResponse.json({
      path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      publicUrl,
    })
  } catch (error) {
    console.error('Signed upload URL error:', error)
    return NextResponse.json({ error: 'Could not prepare the upload. Please try again.' }, { status: 500 })
  }
}
