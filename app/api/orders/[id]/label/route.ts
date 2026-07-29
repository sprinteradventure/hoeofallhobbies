import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'
import { purchaseLabelForOrder, requoteAndPurchaseLabel } from '@/lib/shippo'

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
      .select(
        'id, seller_id, status, shippo_rate_id, shippo_transaction_id, shipping_address, shipping_service_level, shipping_cost'
      )
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

    // --- Buy the label: direct against the stored rate first -----------------
    const result = await purchaseLabelForOrder(admin, {
      id: order.id,
      shippo_rate_id: order.shippo_rate_id,
    })

    if (result.ok !== false) {
      console.log(`[label] order ${order.id}: label purchased via direct path (stored rate)`)
      return NextResponse.json({
        labelUrl: result.labelUrl,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
      })
    }

    // --- Self-healing fallback: the stored shipment may be unusable ----------
    // (created before the from-address carried email/phone, rate expired,
    // etc.). Rebuild a fresh shipment from the seller's current profile +
    // the order's address and retry once, price-checked against what the
    // buyer paid.
    console.warn(
      `[label] order ${order.id}: direct purchase failed (${result.message}) — attempting re-quote fallback`
    )

    const fallback = await requoteAndPurchaseLabel(admin, {
      id: order.id,
      seller_id: order.seller_id,
      shipping_address: order.shipping_address as Record<string, any> | null,
      shipping_service_level: order.shipping_service_level,
      shipping_cost: order.shipping_cost,
    })

    if (fallback.ok === false) {
      // Surface the carrier's own message (billing errors, invalid rate,
      // rate-increased, etc.) so the seller/admin knows what to fix.
      console.error(`[label] order ${order.id}: re-quote fallback failed (${fallback.message})`)
      return NextResponse.json({ error: fallback.message }, { status: 502 })
    }

    console.log(`[label] order ${order.id}: label purchased via re-quote fallback (fresh shipment)`)
    return NextResponse.json({
      labelUrl: fallback.labelUrl,
      trackingNumber: fallback.trackingNumber,
      trackingUrl: fallback.trackingUrl,
    })
  } catch (error) {
    console.error('Manual label generation error:', error)
    return NextResponse.json({ error: 'Label generation failed. Please try again.' }, { status: 500 })
  }
}
