import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'
import { purchaseLabelForOrder } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// ============================================================================
// MANUAL LABEL (RE)GENERATION — LIVE
// ----------------------------------------------------------------------------
// POST /api/orders/[id]/label
// Authorization: Bearer <supabase access token> (order's seller or an admin)
//
// The webhook buys the Shippo label automatically after payment, but when
// that fails (e.g. no payment method on the Shippo account) the order sits
// paid with no label and the webhook never retries. This route lets the
// seller (or an admin) retry on demand from the orders page. Carrier errors
// are returned to the UI — never swallowed.
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

    const admin = getSupabaseAdmin()
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // --- Load the order -------------------------------------------------------
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, seller_id, status, shippo_rate_id, shippo_transaction_id')
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
          { error: 'Only the seller for this order can generate its label.' },
          { status: 403 }
        )
      }
    }

    // --- Guards ---------------------------------------------------------------
    if (order.shippo_transaction_id) {
      return NextResponse.json(
        { error: 'A shipping label was already generated for this order.', code: 'LABEL_ALREADY_GENERATED' },
        { status: 409 }
      )
    }
    if (!order.shippo_rate_id) {
      return NextResponse.json(
        { error: 'This order has no shipping rate on file, so no label can be generated.', code: 'NO_SHIPPO_RATE' },
        { status: 400 }
      )
    }
    if (order.status !== 'paid' && !(order.status === 'shipped')) {
      return NextResponse.json(
        { error: `Labels can only be generated for paid orders (this order is "${order.status}").`, code: 'ORDER_NOT_PAID' },
        { status: 400 }
      )
    }

    // --- Buy the label (shared implementation with the webhook) ---------------
    const result = await purchaseLabelForOrder(admin, {
      id: order.id,
      shippo_rate_id: order.shippo_rate_id,
    })

    if (result.ok === false) {
      // Surface the carrier's own message (billing errors, invalid rate,
      // etc.) so the seller knows what to fix.
      return NextResponse.json({ error: result.message }, { status: 502 })
    }

    return NextResponse.json({
      labelUrl: result.labelUrl,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
    })
  } catch (error) {
    console.error('Manual label generation error:', error)
    return NextResponse.json({ error: 'Label generation failed. Please try again.' }, { status: 500 })
  }
}
