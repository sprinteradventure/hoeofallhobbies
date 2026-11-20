import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST /api/coupons/validate — buyer-side check for a seller coupon code.
//
// Body: { seller_id, code }
// Returns { valid, percent_off?, message? }. Validation re-runs server-side
// inside /api/checkout with the service role (this endpoint and checkout both
// treat the client as untrusted). Public by design: a code is only useful
// with its exact seller_id + code pair, which the seller hands out themselves.
// Requires migration 018 (seller_coupons table).
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const sellerId = typeof body?.seller_id === 'string' ? body.seller_id : null
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!sellerId || !code) {
      return NextResponse.json({ valid: false, message: 'Enter a code.' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: coupon, error } = await admin
      .from('seller_coupons')
      .select('percent_off, max_uses, used_count, expires_at, is_active')
      .eq('seller_id', sellerId)
      .eq('code', code)
      .maybeSingle()

    if (error) {
      // Table missing (migration 018 not applied) — report invalid, not 500.
      console.error('Coupon validate error:', error.message)
      return NextResponse.json({ valid: false, message: 'That code isn\'t valid.' })
    }
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'That code isn\'t valid.' })
    }
    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, message: 'That code has been paused.' })
    }
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, message: 'That code has been fully redeemed.' })
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: 'That code has expired.' })
    }

    return NextResponse.json({ valid: true, percent_off: coupon.percent_off })
  } catch (err) {
    console.error('Coupon validate failed:', err)
    return NextResponse.json({ valid: false, message: 'Could not check that code. Try again.' })
  }
}
