import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /api/reports
// Authorization: Bearer <supabase access token>
// Body: { product_id, reason, details? }
// Any signed-in user may report an active listing that is not their own.
// One open report per reporter per product (409 on duplicate).
const ALLOWED_REASONS = [
  'Prohibited or dangerous item',
  'Counterfeit or recalled item',
  'Wrong category or misleading',
  'Spam or scam',
  'Inappropriate content',
  'Other',
]

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to report a listing.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to report a listing.' }, { status: 401 })
    }
    const reporter = userData.user

    const body = await request.json().catch(() => null)
    const productId = body?.product_id
    const reason = body?.reason
    const details = typeof body?.details === 'string' ? body.details.trim() : null

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Missing product_id.' }, { status: 400 })
    }
    if (!reason || !ALLOWED_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Please choose a valid reason.' }, { status: 400 })
    }

    // Verify the product exists and is active.
    const { data: product, error: productError } = await admin
      .from('products')
      .select('id, seller_id, is_active')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (!product.is_active) {
      return NextResponse.json({ error: 'This listing is no longer active.' }, { status: 400 })
    }
    if (product.seller_id === reporter.id) {
      return NextResponse.json({ error: 'You cannot report your own listing.' }, { status: 400 })
    }

    // Dedupe: one open report per reporter per product.
    const { data: existing, error: existingError } = await admin
      .from('reports')
      .select('id')
      .eq('reporter_id', reporter.id)
      .eq('product_id', productId)
      .eq('status', 'open')
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this listing. Our team is reviewing it.' },
        { status: 409 }
      )
    }

    const { data: report, error: insertError } = await admin
      .from('reports')
      .insert({
        reporter_id: reporter.id,
        product_id: productId,
        reason,
        details: details || null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 })
  }
}
