import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { purchaseLabelForOrder } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE WEBHOOK — LIVE
// ----------------------------------------------------------------------------
// checkout.session.completed: flips the order(s) from 'payment_pending' to
// 'paid', records the payment intent, and clears the purchased items from the
// buyer's cart. Signature is verified with STRIPE_WEBHOOK_SECRET; unverified
// requests are rejected with 400.
//
// account.updated: keeps user_profiles.stripe_onboarding_complete and
// stripe_payouts_enabled in sync with the seller's Stripe Express account
// (row matched on stripe_account_id).
//
// Configured endpoint (see STRIPE_SETUP.md):
//   URL:    https://hoe-of-all-hobbies.vercel.app/api/webhooks/stripe
//   Events: checkout.session.completed, account.updated
// ============================================================================

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!webhookSecret || !stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
      { status: 501 }
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // Raw body is required for signature verification — do NOT JSON.parse first.
  const rawBody = await request.text()

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const orderIds: string[] = (session.metadata?.order_ids || '')
        .split(',')
        .filter(Boolean)

      if (orderIds.length > 0) {
        const admin = getSupabaseAdmin()
        const { error } = await admin
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent ?? null,
          })
          .in('id', orderIds)

        if (error) throw error

        // --- Buy Shippo labels for orders that checked out with real rates --
        // CRITICAL: label failures must never fail the webhook. Each order is
        // handled independently; on failure the order stays 'paid' with null
        // label fields so it can be followed up manually.
        try {
          const { data: shippableOrders } = await admin
            .from('orders')
            .select('id, shippo_rate_id')
            .in('id', orderIds)
            .not('shippo_rate_id', 'is', null)
            .is('shippo_transaction_id', null)

          for (const order of shippableOrders || []) {
            try {
              const result = await purchaseLabelForOrder(admin, {
                id: order.id,
                shippo_rate_id: order.shippo_rate_id,
              })
              if (result.ok === false) {
                // Carrier-side failure (e.g. no billing method on the Shippo
                // account): log and move on — the seller can retry manually
                // from their orders page via POST /api/orders/[id]/label.
                console.error(`Shippo label purchase failed for order ${order.id}: ${result.message}`)
              }
            } catch (labelError) {
              console.error(`Shippo label purchase failed for order ${order.id}:`, labelError)
            }
          }
        } catch (labelQueryError) {
          console.error('Shippo label step failed (orders remain paid):', labelQueryError)
        }

        // Payment succeeded — clear the buyer's purchased items (stock was
        // already decremented when the checkout session was created). Only
        // the items in these orders are removed: checkout is per-seller, so
        // other sellers' items may still be waiting in the cart.
        const buyerId = session.metadata?.buyer_id
        if (buyerId) {
          const { data: purchasedItems } = await admin
            .from('order_items')
            .select('product_id')
            .in('order_id', orderIds)

          const purchasedProductIds = (purchasedItems || [])
            .map((row: any) => row.product_id)
            .filter(Boolean)

          if (purchasedProductIds.length > 0) {
            await admin
              .from('cart_items')
              .delete()
              .eq('user_id', buyerId)
              .in('product_id', purchasedProductIds)
          } else {
            // Legacy sessions without order_items: fall back to clearing the
            // whole cart (pre-Connect behavior).
            await admin.from('cart_items').delete().eq('user_id', buyerId)
          }
        }
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as any
      const admin = getSupabaseAdmin()

      const { error } = await admin
        .from('user_profiles')
        .update({
          stripe_onboarding_complete: !!account.details_submitted,
          stripe_payouts_enabled: !!(account.payouts_enabled && account.charges_enabled),
        })
        .eq('stripe_account_id', account.id)

      if (error) throw error
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    )
  }
}
