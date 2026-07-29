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
      admin.from('orders').select('total_price, platform_fee, shipping_cost, status'),
      admin.from('user_profiles').select('id, is_seller'),
      admin.from('products').select('id, is_active'),
    ])

    if (ordersError) throw ordersError
    if (usersError) throw usersError
    if (productsError) throw productsError

    // Revenue breakdown. Platform commission is 5% of order item totals
    // (owner decision, June 2026) PLUS the buyer's shipping payment — the
    // platform buys the Shippo label, so shipping stays with the platform.
    // orders.platform_fee (migration 006) stores exactly that for new orders;
    // total_price is items-only, so shipping_cost is added to gross sales.
    // 'Paid or later' = the buyer actually paid, so
    // payment_pending/disputed/refunded/cancelled orders are excluded.
    const PAID_STATUSES = ['paid', 'shipped', 'delivered', 'completed']
    const allOrders = orders || []
    const paidOrdersList = allOrders.filter((o) =>
      PAID_STATUSES.includes(o.status)
    )

    const grossSales = paidOrdersList.reduce(
      (sum, o) => sum + (o.total_price || 0) + ((o as any).shipping_cost || 0),
      0
    )
    const platformFees = paidOrdersList.reduce(
      (sum, o) =>
        sum + (o.platform_fee != null
          ? o.platform_fee
          : (o.total_price || 0) * 0.05 + ((o as any).shipping_cost || 0)),
      0
    )
    const sellerPayouts = grossSales - platformFees

    return NextResponse.json({
      grossSales: grossSales.toFixed(2),
      platformFees: platformFees.toFixed(2),
      sellerPayouts: sellerPayouts.toFixed(2),
      pendingOrders: allOrders.filter((o) => o.status === 'payment_pending')
        .length,
      paidOrders: paidOrdersList.length,
      totalOrders: allOrders.length,
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
