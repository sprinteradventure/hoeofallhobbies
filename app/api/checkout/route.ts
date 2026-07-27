import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE CHECKOUT — LIVE
// ----------------------------------------------------------------------------
// Server-side checkout flow:
//   1. Authenticate the buyer from their Supabase access token.
//   2. Load the cart server-side (client prices are never trusted).
//   3. Decrement stock atomically per item (refuses to oversell -> 409).
//   4. Create one order per seller with status 'payment_pending', plus one
//      order_items row per cart item, plus the 5% platform fee bookkeeping.
//   5. Create a Stripe Checkout Session and return its hosted URL.
//
// The webhook (/api/webhooks/stripe) flips orders to 'paid' on
// checkout.session.completed and clears the buyer's cart.
//
// Payments settle into the platform's Stripe account (no Stripe Connect);
// sellers are paid out manually. The 5% commission is bookkeeping only.
// ============================================================================

const PLATFORM_FEE_PERCENT = 5

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
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

    // Optional shipping address collected by the checkout form.
    const body = await request.json().catch(() => ({}))
    const shippingAddress = body?.shippingAddress ?? null

    // --- Load the buyer's cart server-side (never trust client prices) -----
    const { data: cartItems, error: cartError } = await admin
      .from('cart_items')
      .select('id, product_id, quantity, product:products(id, seller_id, title, price, quantity)')
      .eq('user_id', user.id)

    if (cartError) throw cartError
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // --- Decrement stock atomically per item (refuses to oversell) ---------
    for (const item of cartItems) {
      const { data: decremented, error: stockError } = await admin.rpc(
        'decrement_product_stock',
        { p_product_id: item.product_id, p_quantity: item.quantity }
      )
      if (stockError) throw stockError
      if (!decremented) {
        return NextResponse.json(
          {
            error: `Not enough stock for "${(item.product as any).title}". Please adjust your cart.`,
            code: 'INSUFFICIENT_STOCK',
          },
          { status: 409 }
        )
      }
    }

    // --- Create orders + order_items with status 'payment_pending' ---------
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
      const platformFee = Math.round(totalPrice * PLATFORM_FEE_PERCENT) / 100

      const { data: order, error: orderError } = await admin
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: sellerId,
          product_id: items[0].product_id, // legacy column; line items are in order_items
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_price: totalPrice,
          platform_fee: platformFee,
          shipping_address: shippingAddress,
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
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: cartItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round((item.product as any).price * 100),
          product_data: { name: (item.product as any).title },
        },
      })),
      metadata: { order_ids: orderIds.join(','), buyer_id: user.id },
      success_url: `${appUrl}/shop/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/shop/cart`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    )
  }
}
