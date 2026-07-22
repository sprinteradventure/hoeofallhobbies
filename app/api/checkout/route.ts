import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE CHECKOUT — PREPARED STUB (not yet live)
// ----------------------------------------------------------------------------
// This route is the future server-side checkout flow. It is intentionally
// gated behind env vars so it can ship to production safely before the owner
// finishes Stripe setup.
//
// REQUIRED Vercel env vars to activate (see STRIPE_SETUP.md):
//   STRIPE_SECRET_KEY                    sk_live_... or sk_test_...
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   pk_live_... or pk_test_...
//   STRIPE_WEBHOOK_SECRET                whsec_... (from the webhook you create)
//   NEXT_PUBLIC_APP_URL                  https://<production domain>
//
// Until STRIPE_SECRET_KEY is set, this route returns HTTP 501 and the
// existing client-side "pending order" checkout remains the live flow.
// ============================================================================

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error: 'Stripe is not configured yet',
        code: 'STRIPE_NOT_CONFIGURED',
        // TODO(owner): add STRIPE_SECRET_KEY in Vercel, then switch the
        // client checkout page to POST here instead of inserting orders
        // directly. See STRIPE_SETUP.md.
      },
      { status: 501 }
    )
  }

  try {
    // --- Auth: identify the buyer from their Supabase access token ---------
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

    // --- Load the buyer's cart server-side (never trust client prices) -----
    const { data: cartItems, error: cartError } = await admin
      .from('cart_items')
      .select('id, product_id, quantity, product:products(id, seller_id, title, price, quantity)')
      .eq('user_id', user.id)

    if (cartError) throw cartError
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // TODO(stripe): verify stock for each item here (product.quantity >=
    // item.quantity) and return 409 with the offending item if not.

    // --- Create orders + order_items with status 'payment_pending' ---------
    // Group by seller exactly like the current client flow.
    const sellerOrders = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const sellerId = (item.product as any).seller_id
      if (!sellerOrders.has(sellerId)) sellerOrders.set(sellerId, [])
      sellerOrders.get(sellerId)!.push(item)
    }

    const orderIds: string[] = []
    for (const [sellerId, items] of sellerOrders.entries()) {
      const totalPrice = items.reduce(
        (sum, item) => sum + (item.product as any).price * item.quantity,
        0
      )

      const { data: order, error: orderError } = await admin
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: sellerId,
          product_id: items[0].product_id, // legacy column; line items are in order_items
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_price: totalPrice,
          shipping_address: null, // TODO(stripe): collect via Stripe Checkout shipping_address_collection
          status: 'payment_pending',
        })
        .select()
        .single()

      if (orderError) throw orderError
      orderIds.push(order.id)

      const { error: itemsError } = await admin.from('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: (item.product as any).price,
        }))
      )
      if (itemsError) throw itemsError
    }

    // --- Create the Stripe Checkout Session --------------------------------
    // TODO(owner): after adding STRIPE_SECRET_KEY, uncomment and test this
    // block in Stripe test mode, then flip the client checkout page to use it.
    //
    // const Stripe = (await import('stripe')).default
    // const stripe = new Stripe(stripeSecretKey)
    // const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',
    //   line_items: cartItems.map((item) => ({
    //     quantity: item.quantity,
    //     price_data: {
    //       currency: 'usd',
    //       unit_amount: Math.round((item.product as any).price * 100),
    //       product_data: { name: (item.product as any).title },
    //     },
    //   })),
    //   // TODO(stripe): platform fee / seller split — decide commission first
    //   // (owner decision pending; do NOT hardcode a fee here).
    //   metadata: { order_ids: orderIds.join(','), buyer_id: user.id },
    //   success_url: `${appUrl}/shop/orders?checkout=success`,
    //   cancel_url: `${appUrl}/shop/checkout?checkout=cancelled`,
    // })
    // return NextResponse.json({ url: session.url })

    return NextResponse.json(
      {
        error: 'Stripe session creation is stubbed',
        code: 'STRIPE_STUB',
        orderIds,
        // TODO(owner): remove this branch once the session block above is live.
      },
      { status: 501 }
    )
  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    )
  }
}
