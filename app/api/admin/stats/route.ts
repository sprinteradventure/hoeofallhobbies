import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats
// Authorization: Bearer <supabase access token>
// Only users whose email is in the ADMIN_EMAILS env allowlist receive data.
// Stats are computed server-side with the service-role key, so unauthorized
// users cannot obtain platform-wide data even by bypassing the client UI.
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

    const [
      { data: orders, error: ordersError },
      { data: users, error: usersError },
      { data: products, error: productsError },
    ] = await Promise.all([
      admin.from('orders').select('total_price, status'),
      admin.from('user_profiles').select('id, is_seller'),
      admin.from('products').select('id, is_active'),
    ])

    if (ordersError) throw ordersError
    if (usersError) throw usersError
    if (productsError) throw productsError

    // NOTE: platform revenue share is intentionally left as-is (20%) pending
    // the owner's commission decision. Do not change without their sign-off.
    const totalRevenue =
      orders?.reduce((sum, o) => sum + (o.total_price || 0) * 0.2, 0) || 0

    return NextResponse.json({
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: orders?.length || 0,
      activeUsers: users?.length || 0,
      sellerCount: users?.filter((u) => u.is_seller).length || 0,
      activeProducts: products?.filter((p) => p.is_active).length || 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load admin stats' },
      { status: 500 }
    )
  }
}
