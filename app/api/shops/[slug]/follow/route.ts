import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// /api/shops/[slug]/follow — storefront following.
//   GET  -> { count, following }         (auth optional; anonymous gets count only)
//   POST -> { count, following } toggle  (auth required)
//
// Writes go through the service role after token verification; RLS policies
// (migration 019) backstop the same ownership rules for direct client access.
// Requires migration 019 — until applied, GET returns { count: 0, following:
// false, unavailable: true } and POST 409s, so UI degrades quietly.
// ============================================================================

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  return error ? null : user
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const admin = getSupabaseAdmin()
    const slug = params.slug

    let count = 0
    try {
      const { count: c } = await admin
        .from('shop_follows')
        .select('id', { count: 'exact', head: true })
        .eq('shop_slug', slug)
      count = c ?? 0
    } catch {
      return NextResponse.json({ count: 0, following: false, unavailable: true })
    }

    const user = await getUserFromRequest(request)
    let following = false
    if (user) {
      const { data } = await admin
        .from('shop_follows')
        .select('id')
        .eq('shop_slug', slug)
        .eq('follower_id', user.id)
        .maybeSingle()
      following = !!data
    }

    return NextResponse.json({ count, following })
  } catch (err) {
    console.error('Follow GET failed:', err)
    return NextResponse.json({ count: 0, following: false, unavailable: true })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in to follow shops.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const sellerId = typeof body?.seller_id === 'string' ? body.seller_id : null
    if (!sellerId || sellerId === user.id) {
      return NextResponse.json({ error: 'Invalid follow target.' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const slug = params.slug

    const { data: existing } = await admin
      .from('shop_follows')
      .select('id')
      .eq('shop_slug', slug)
      .eq('follower_id', user.id)
      .maybeSingle()

    let following: boolean
    if (existing) {
      await admin.from('shop_follows').delete().eq('id', (existing as any).id)
      following = false
    } else {
      const { error } = await admin
        .from('shop_follows')
        .insert({ shop_slug: slug, seller_id: sellerId, follower_id: user.id })
      if (error) throw error
      following = true
    }

    const { count } = await admin
      .from('shop_follows')
      .select('id', { count: 'exact', head: true })
      .eq('shop_slug', slug)

    return NextResponse.json({ count: count ?? 0, following })
  } catch (err) {
    console.error('Follow POST failed:', err)
    return NextResponse.json(
      { error: 'Following isn\'t available yet. Please try again later.' },
      { status: 409 }
    )
  }
}
