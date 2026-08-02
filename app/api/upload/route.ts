import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// IMAGE UPLOAD — LIVE (Supabase Storage)
// ----------------------------------------------------------------------------
// POST /api/upload
// Authorization: Bearer <supabase access token>
// Body: multipart/form-data with a single `file` field.
//
// Sellers only (user_profiles.is_seller). Validates mime + size, lazily
// ensures the public `product-images` bucket exists, uploads to
// <user_id>/<uuid>.<ext> and returns the public URL. Uses the service-role
// client server-side; the key is never exposed or logged.
// ============================================================================

const BUCKET = 'product-images'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth: Bearer token, sellers only ------------------------------------
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to upload images.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to upload images.' }, { status: 401 })
    }
    const user = userData.user

    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('is_seller')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_seller) {
      return NextResponse.json(
        { error: 'Only sellers can upload product images.' },
        { status: 403 }
      )
    }

    // --- Parse + validate the multipart payload -------------------------------
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected a file upload (multipart/form-data).' },
        { status: 415 }
      )
    }

    const formData = await request.formData().catch(() => null)
    const file = formData?.get('file')

    // Duck-typed File check (works across Node/edge runtimes).
    const isFile =
      !!file &&
      typeof file === 'object' &&
      typeof (file as File).arrayBuffer === 'function' &&
      typeof (file as File).type === 'string' &&
      typeof (file as File).size === 'number'

    if (!isFile) {
      return NextResponse.json({ error: 'No image file was provided.' }, { status: 400 })
    }

    const image = file as File
    const ext = ALLOWED_MIME[image.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Unsupported image type. Please use JPEG, PNG, WebP, or GIF.' },
        { status: 415 }
      )
    }
    if (image.size <= 0) {
      return NextResponse.json({ error: 'That file appears to be empty.' }, { status: 400 })
    }
    if (image.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large — the limit is 10 MB.' },
        { status: 413 }
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

    // --- Upload and return the public URL -------------------------------------
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await image.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: image.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl.publicUrl }, { status: 201 })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 })
  }
}
