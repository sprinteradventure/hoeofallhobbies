import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// ORDER STATUS UPDATE — LIVE
// ----------------------------------------------------------------------------
// POST /api/orders/[id]/status
// Authorization: Bearer <supabase access token> (order's seller or an admin)
// Body: { status: 'shipped', tracking_number? }
//
// Migration 017 revoked client-side INSERT/UPDATE on orders and added the
// orders_status_guard trigger (paid -> 'shipped' is the only non-service-role
// transition; financial/identity columns are immutable). This route is the
// server-side path for the one transition sellers legitimately make: marking
// a paid order as shipped, optionally with a tracking number.
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const status = body?.status
    const trackingNumber =
      typeof body?.tracking_number === 'string' && body.tracking_number.trim()
        ? body.tracking_number.trim()
        : null

    if (status !== 'shipped') {
      return NextResponse.json(
        { error: 'The only allowed status update is marking a paid order as shipped.' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // --- Load the order ------------------------------------------------------
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, seller_id, status')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // --- Authorize: the order's seller or an admin ----------------------------
    if (order.seller_id !== user.id) {
      const adminUser = await getAdminUserFromToken(token)
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Only the seller for this order can update its status.' },
          { status: 403 }
        )
      }
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: `Only paid orders can be marked as shipped (this order is "${order.status}").` },
        { status: 409 }
      )
    }

    // --- Apply ----------------------------------------------------------------
    const update: Record<string, unknown> = { status: 'shipped' }
    if (trackingNumber) update.tracking_number = trackingNumber

    const { data: updated, error: updateError } = await admin
      .from('orders')
      .update(update)
      .eq('id', order.id)
      .select('id, status, tracking_number')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Order status update error:', error)
    return NextResponse.json({ error: 'Failed to update order status.' }, { status: 500 })
  }
}
