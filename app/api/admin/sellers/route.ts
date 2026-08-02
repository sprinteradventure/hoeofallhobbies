import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/sellers
// Authorization: Bearer <supabase access token>
// Admin-only (ADMIN_EMAILS allowlist). Lists all seller profiles with their
// verification + payout status for the admin Sellers page.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    const adminUser = await getAdminUserFromToken(token)
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()

    const { data: sellers, error } = await admin
      .from('user_profiles')
      .select(
        'id, email, username, seller_name, full_name, is_seller, seller_verified, verification_status, stripe_payouts_enabled, total_sales, avg_rating, created_at'
      )
      .eq('is_seller', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sellers: sellers || [] })
  } catch (error) {
    console.error('Admin sellers error:', error)
    return NextResponse.json(
      { error: 'Failed to load sellers' },
      { status: 500 }
    )
  }
}
