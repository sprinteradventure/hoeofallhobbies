import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// SIGNED UPLOAD URLS — LIVE (Supabase Storage, direct-to-storage)
// ----------------------------------------------------------------------------
// POST /api/upload/sign
// Authorization: Bearer <supabase access token>
// Body: { kind: 'image' | 'video', contentType: string }
//
// Vercel serverless request bodies cap at ~4.5 MB, so large media cannot be
// proxied through an API route. Instead we mint a signed upload URL on the
// service-role client; the browser then PUTs the bytes straight to Supabase
// Storage (no key needed client-side). Sellers only.
// ============================================================================

const BUCKET = 'product-images'

const ALLOWED: Record<'image' | 'video', Record<string, string>> = {
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
    const kind = body?.kind === 'video' ? 'video' : body?.kind === 'image' ? 'image' : null
    const contentType = typeof body?.contentType === 'string' ? body.contentType : ''

    if (!kind) {
      return NextResponse.json(
        { error: 'kind must be "image" or "video".' },
        { status: 400 }
      )
    }

    const ext = ALLOWED[kind][contentType]
    if (!ext) {
      return NextResponse.json(
        {
          error:
            kind === 'video'
              ? 'Unsupported video type. Please use MP4, WebM, or MOV.'
              : 'Unsupported image type. Please use JPEG, PNG, WebP, or GIF.',
        },
        { status: 415 }
      )
    }

    // --- Ensure the public bucket exists (tolerate already-exists) ------------
    const { error: bucketError } = await admin.storage.createBucket(BUCKET, { public: true })
    if (bucketError) {
      const msg = (bucketError.message || '').toLowerCase()
      const alreadyExists =
        msg.includes('already exists') || (bucketError as any).statusCode === '409'
      if (!alreadyExists) throw bucketError
    }

    // --- Mint the signed upload URL -------------------------------------------
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (signError || !signed) throw signError || new Error('Failed to sign upload URL')

    const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      publicUrl: publicUrl.publicUrl,
    })
  } catch (error) {
    console.error('Signed upload URL error:', error)
    return NextResponse.json({ error: 'Could not prepare the upload. Please try again.' }, { status: 500 })
  }
}
