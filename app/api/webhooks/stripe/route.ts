import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE WEBHOOK — PREPARED STUB (not yet live)
// ----------------------------------------------------------------------------
// Listens for checkout.session.completed and flips orders from
// 'payment_pending' to 'paid'. Gated behind STRIPE_WEBHOOK_SECRET so it is
// inert until the owner creates the webhook endpoint in the Stripe dashboard.
//
// Stripe dashboard webhook to create (see STRIPE_SETUP.md):
//   URL:    https://<production domain>/api/webhooks/stripe
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

        // TODO(stripe): decrement stock here if checkout moves to a
        // reserve-on-payment model; clear the buyer's cart here as well
        // (session.metadata.buyer_id) once the client stops doing it.
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
