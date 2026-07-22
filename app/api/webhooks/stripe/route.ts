import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE WEBHOOK — LIVE
// ----------------------------------------------------------------------------
// Listens for checkout.session.completed, flips the order(s) from
// 'payment_pending' to 'paid', records the payment intent, and clears the
// buyer's cart. Signature is verified with STRIPE_WEBHOOK_SECRET; unverified
// requests are rejected with 400.
//
// Configured endpoint (see STRIPE_SETUP.md):
//   URL:    https://hoe-of-all-hobbies.vercel.app/api/webhooks/stripe
//   Events: checkout.session.completed
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

        // Payment succeeded — clear the buyer's cart (stock was already
        // decremented when the checkout session was created).
        const buyerId = session.metadata?.buyer_id
        if (buyerId) {
          await admin.from('cart_items').delete().eq('user_id', buyerId)
        }
      }
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
