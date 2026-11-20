import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST /api/saves — toggle saving a product.
// Body: { product_id } -> { saved } | 401
//
// Heart buttons on listing cards and detail pages call this. Writes go via
// the service role after token verification; RLS (migration 019) backstops
// the same user-owns-row rule for direct client access. If migration 019
// isn't applied yet, responds 409 so the UI can show a quiet toast instead
// of an error.
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Sign in to save items.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to save items.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const productId = typeof body?.product_id === 'string' ? body.product_id : null
    if (!productId) {
      return NextResponse.json({ error: 'Missing product_id.' }, { status: 400 })
    }

    const { data: existing } = await admin
      .from('product_saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    let saved: boolean
    if (existing) {
      await admin.from('product_saves').delete().eq('id', (existing as any).id)
      saved = false
    } else {
      // Only active products are saveable.
      const { data: product } = await admin
        .from('products')
        .select('id, is_active')
        .eq('id', productId)
        .maybeSingle()
      if (!product || !(product as any).is_active) {
        return NextResponse.json({ error: 'That listing is no longer available.' }, { status: 404 })
      }
      const { error } = await admin
        .from('product_saves')
        .insert({ user_id: user.id, product_id: productId })
      if (error) throw error
      saved = true
    }

    return NextResponse.json({ saved })
  } catch (err) {
    console.error('Save toggle failed:', err)
    return NextResponse.json(
      { error: 'Saving isn\'t available yet. Please try again later.' },
      { status: 409 }
    )
  }
}
