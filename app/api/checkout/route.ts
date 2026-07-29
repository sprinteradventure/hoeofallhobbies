import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { shippoGetRate, shippoGetShipment, ShippoError } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE CHECKOUT — LIVE (Stripe Connect destination charges)
// ----------------------------------------------------------------------------
// Server-side checkout flow:
//   1. Authenticate the buyer from their Supabase access token.
//   2. Load the cart server-side (client prices are never trusted).
//   3. Scope the checkout to ONE seller. Stripe Checkout Sessions support a
//      single payment_intent_data.transfer_data.destination, so a mixed cart
//      is checked out per seller (the checkout page renders one button per
//      seller group and passes seller_id). Calling without seller_id is only
//      valid when the whole cart belongs to one seller.
//   4. Verify the seller has finished Stripe Connect onboarding
//      (stripe_payouts_enabled). If not -> 409; we never silently keep the
//      seller's share on the platform.
//   5. Decrement stock atomically per item (refuses to oversell -> 409).
//   6. Create the order + order_items rows with status 'payment_pending',
//      plus platform fee bookkeeping: 5% of the items subtotal PLUS the
//      buyer's shipping payment (the platform buys the Shippo label, so the
//      shipping money must stay with the platform, not the seller).
//   7. Create a Stripe Checkout Session as a destination charge:
//      the seller's Express account receives exactly 95% of the items
//      subtotal; the platform keeps 5% + shipping via application_fee_amount.
//
// The webhook (/api/webhooks/stripe) flips orders to 'paid' on
// checkout.session.completed and clears the purchased cart items.
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

    // Optional shipping address collected by the checkout form, plus the
    // optional seller scope for per-seller checkout.
    const body = await request.json().catch(() => ({}))
    const requestedSellerId =
      typeof body?.seller_id === 'string' ? body.seller_id : null

    // Real shipping selection from /api/shipping/rates. When present we
    // re-verify the rate with Shippo and charge ITS amount — the client's
    // quoted price is never trusted. Absent = legacy flow (items only).
    const shipping =
      body?.shipping && typeof body.shipping === 'object'
        ? {
            shipmentId: typeof body.shipping.shipmentId === 'string' ? body.shipping.shipmentId : null,
            rateId: typeof body.shipping.rateId === 'string' ? body.shipping.rateId : null,
            address: body.shipping.address ?? null,
          }
        : null

    // Normalize the shipping address for the order row. The checkout page
    // form is the single source of truth (Stripe address collection is
    // intentionally NOT enabled on the session). Both the new
    // {name, street1, street2, ...} shape and the legacy
    // {fullName, address, ...} shape map to the same stored keys so older
    // order views keep rendering.
    const rawAddress = shipping?.address ?? body?.shippingAddress ?? null
    const shippingAddress = rawAddress
      ? {
          fullName: rawAddress.fullName ?? rawAddress.name ?? null,
          address: rawAddress.address ?? rawAddress.street1 ?? null,
          address2: rawAddress.address2 ?? rawAddress.street2 ?? null,
          city: rawAddress.city ?? null,
          state: rawAddress.state ?? null,
          zip: rawAddress.zip ?? null,
          phone: rawAddress.phone ?? null,
          country: rawAddress.country ?? 'US',
        }
      : null

    // --- Load the buyer's cart server-side (never trust client prices) -----
    const { data: cartItems, error: cartError } = await admin
      .from('cart_items')
      .select('id, product_id, quantity, product:products(id, seller_id, title, price, quantity)')
      .eq('user_id', user.id)

    if (cartError) throw cartError
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // --- Group the cart by seller ------------------------------------------
    const sellerOrders = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const sellerId = (item.product as any).seller_id
      if (!sellerOrders.has(sellerId)) sellerOrders.set(sellerId, [])
      sellerOrders.get(sellerId)!.push(item)
    }

    // --- Scope the checkout to a single seller ------------------------------
    // A Stripe Checkout Session can transfer to exactly one connected
    // account, so mixed carts must be checked out one seller at a time.
    let scopedItems = cartItems
    if (requestedSellerId) {
      const group = sellerOrders.get(requestedSellerId)
      if (!group || group.length === 0) {
        return NextResponse.json(
          { error: 'That seller has no items in your cart.', code: 'SELLER_NOT_IN_CART' },
          { status: 400 }
        )
      }
      scopedItems = group
    } else if (sellerOrders.size > 1) {
      return NextResponse.json(
        {
          error: 'Your cart has items from multiple sellers. Please check out with each seller separately.',
          code: 'MULTI_SELLER_CART',
        },
        { status: 409 }
      )
    }

    const scopedSellerIds = Array.from(
      new Set(scopedItems.map((item) => (item.product as any).seller_id as string))
    )

    // --- Payout gate: the seller must be able to receive their 95% ----------
    const { data: sellerProfiles, error: sellerError } = await admin
      .from('user_profiles')
      .select('id, stripe_account_id, stripe_payouts_enabled')
      .in('id', scopedSellerIds)

    if (sellerError) throw sellerError

    const sellerById = new Map((sellerProfiles || []).map((p: any) => [p.id, p]))
    for (const sellerId of scopedSellerIds) {
      const seller = sellerById.get(sellerId)
      if (!seller?.stripe_payouts_enabled || !seller?.stripe_account_id) {
        return NextResponse.json(
          {
            error: "This seller hasn't set up payouts yet, so their items can't be purchased right now. Please try again later.",
            code: 'SELLER_PAYOUTS_NOT_SETUP',
            seller_id: sellerId,
          },
          { status: 409 }
        )
      }
    }

    // --- Verify the chosen Shippo rate server-side (never trust the client) --
    // The rate's own amount is what the buyer is charged for shipping. We
    // also confirm the rate belongs to the quoted shipment and that the
    // shipment's destination matches the address submitted with this order.
    let verifiedShipping: {
      rateId: string
      shipmentId: string
      amountDollars: number
      amountCents: number
      serviceLevel: string
      estimatedDays: number
    } | null = null

    if (shipping) {
      if (
        !shipping.shipmentId ||
        !shipping.rateId ||
        !shippingAddress?.city ||
        !shippingAddress?.state ||
        !shippingAddress?.zip
      ) {
        return NextResponse.json(
          { error: 'Please choose a shipping option before checking out.', code: 'SHIPPING_REQUIRED' },
          { status: 400 }
        )
      }

      try {
        const rate = await shippoGetRate(shipping.rateId)
        if (rate.shipment !== shipping.shipmentId) {
          return NextResponse.json(
            { error: 'That shipping option is no longer valid. Please re-select shipping.', code: 'SHIPPING_RATE_MISMATCH' },
            { status: 400 }
          )
        }

        const shippoShipment = await shippoGetShipment(shipping.shipmentId)
        const to = shippoShipment?.address_to ?? {}
        const zip5 = (z: unknown) => String(z ?? '').replace(/\D/g, '').slice(0, 5)
        const sameText = (a: unknown, b: unknown) =>
          String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
        const addressMatches =
          sameText(to.city, shippingAddress.city) &&
          sameText(to.state, shippingAddress.state) &&
          zip5(to.zip) === zip5(shippingAddress.zip)

        if (!addressMatches) {
          return NextResponse.json(
            { error: 'The shipping address changed after rates were quoted. Please re-select shipping.', code: 'SHIPPING_ADDRESS_MISMATCH' },
            { status: 400 }
          )
        }

        const amountDollars = parseFloat(rate.amount)
        if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
          throw new ShippoError('Shipping provider returned an invalid rate amount.')
        }

        const estimatedDays = typeof rate.estimated_days === 'number' && rate.estimated_days > 0
          ? rate.estimated_days
          : 3

        verifiedShipping = {
          rateId: rate.object_id,
          shipmentId: shipping.shipmentId,
          amountDollars,
          amountCents: Math.round(amountDollars * 100),
          serviceLevel: `${rate.provider} ${rate.servicelevel?.name || rate.servicelevel?.token || 'Standard'}`,
          estimatedDays,
        }
      } catch (err) {
        if (err instanceof ShippoError) {
          console.error('Shippo rate verification failed:', err.message)
          return NextResponse.json(
            { error: 'Shipping is temporarily unavailable. Please try again in a moment.' },
            { status: 502 }
          )
        }
        throw err
      }
    }

    // --- Decrement stock atomically per item (refuses to oversell) ---------
    for (const item of scopedItems) {
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
    const scopedSellerOrders = new Map<string, typeof cartItems>()
    for (const item of scopedItems) {
      const sellerId = (item.product as any).seller_id
      if (!scopedSellerOrders.has(sellerId)) scopedSellerOrders.set(sellerId, [])
      scopedSellerOrders.get(sellerId)!.push(item)
    }

    const orderIds: string[] = []
    for (const [sellerId, items] of scopedSellerOrders.entries()) {
      const totalPrice = items.reduce(
        (sum, item) => sum + (item.product as any).price * item.quantity,
        0
      )
      // Platform fee = 5% of the items subtotal PLUS the shipping payment
      // (the platform purchases the Shippo label, so shipping stays with the
      // platform). The seller nets exactly 95% of the items subtotal.
      const platformFee =
        Math.round(totalPrice * PLATFORM_FEE_PERCENT) / 100 +
        (verifiedShipping?.amountDollars ?? 0)

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
          shipping_cost: verifiedShipping?.amountDollars ?? null,
          shipping_service_level: verifiedShipping?.serviceLevel ?? null,
          shippo_shipment_id: verifiedShipping?.shipmentId ?? null,
          shippo_rate_id: verifiedShipping?.rateId ?? null,
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

    // --- Create the Stripe Checkout Session (destination charge) -----------
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'

    const subtotalCents = scopedItems.reduce(
      (sum, item) => sum + Math.round((item.product as any).price * 100) * item.quantity,
      0
    )
    // application_fee_amount = 5% of items subtotal + the shipping payment.
    // Stripe then transfers (charge total - fee) = exactly 95% of the items
    // subtotal to the seller. The fee can never exceed the charge total by
    // construction (charge = items + shipping); clamp defensively anyway.
    const shippingAmountCents = verifiedShipping?.amountCents ?? 0
    const chargeTotalCents = subtotalCents + shippingAmountCents
    const applicationFeeCents = Math.min(
      Math.round((subtotalCents * PLATFORM_FEE_PERCENT) / 100) + shippingAmountCents,
      chargeTotalCents
    )

    // Exactly one seller per session (enforced above).
    const destinationAccount = sellerById.get(scopedSellerIds[0])!.stripe_account_id as string

    // Stripe Tax readiness: off by default. Once the owner completes Stripe
    // Tax registration, set STRIPE_AUTOMATIC_TAX=true in Vercel and Stripe
    // computes/collects tax on the session automatically. customer_update
    // lets Stripe refresh the customer address it uses for tax calculation.
    const automaticTaxEnabled = process.env.STRIPE_AUTOMATIC_TAX === 'true'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: scopedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round((item.product as any).price * 100),
          product_data: { name: (item.product as any).title },
        },
      })),
      automatic_tax: { enabled: automaticTaxEnabled },
      ...(automaticTaxEnabled ? { customer_update: { address: 'auto' as const } } : {}),
      // The verified Shippo rate becomes the session's single shipping
      // option. NOTE: shipping_address_collection is intentionally NOT set —
      // our checkout form is the one source of truth for the address, which
      // is stored on the order row above.
      ...(verifiedShipping
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: 'fixed_amount' as const,
                  fixed_amount: { amount: verifiedShipping.amountCents, currency: 'usd' },
                  display_name: verifiedShipping.serviceLevel,
                  delivery_estimate: {
                    minimum: { unit: 'business_day' as const, value: verifiedShipping.estimatedDays },
                    maximum: { unit: 'business_day' as const, value: verifiedShipping.estimatedDays + 3 },
                  },
                },
              },
            ],
          }
        : {}),
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: { destination: destinationAccount },
      },
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
