import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { shippoCreateShipment, ShippoError, ShippoRate } from '@/lib/shippo'

export const dynamic = 'force-dynamic'

// ============================================================================
// SHIPPING RATES — LIVE (Shippo)
// ----------------------------------------------------------------------------
// POST /api/shipping/rates
// Authorization: Bearer <supabase access token>
// Body: { seller_id, address: { name, street1, street2?, city, state, zip } }
//
// Quotes real carrier rates for the buyer's cart items belonging to ONE
// seller: builds a single parcel (aggregated item weights with fallbacks to
// the seller's default parcel) and creates a Shippo shipment from the
// seller's ship-from address to the buyer. Returns up to 3 curated rates
// (USPS Ground Advantage, USPS Priority, cheapest overall). The rate objects
// are re-verified server-side again at checkout time — clients never set the
// shipping price.
//
// Failure contract:
//   409 SELLER_SHIPPING_NOT_SETUP — seller has no ship-from address on file
//   502 — Shippo unreachable / no rates (buyer is told to try again)
// ============================================================================

const FALLBACK_PARCEL = { length: 9, width: 6, height: 3 }
const FALLBACK_ITEM_WEIGHT_OZ = 8

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}))
    const sellerId = typeof body?.seller_id === 'string' ? body.seller_id : null
    const address = body?.address ?? {}

    if (!sellerId) {
      return NextResponse.json({ error: 'Missing seller_id.' }, { status: 400 })
    }

    const toName = cleanText(address.name)
    const toStreet1 = cleanText(address.street1)
    const toCity = cleanText(address.city)
    const toState = cleanText(address.state)
    const toZip = cleanText(address.zip)
    if (!toName || !toStreet1 || !toCity || !toState || !toZip) {
      return NextResponse.json(
        { error: 'Please complete the shipping address (name, street, city, state, ZIP).' },
        { status: 400 }
      )
    }

    // --- Seller ship-from + default parcel ----------------------------------
    // email (account) + phone are selected too: USPS rejects label creation
    // unless the from-address carries seller email or phone.
    const { data: seller, error: sellerError } = await admin
      .from('user_profiles')
      .select(
        'id, username, email, ship_name, ship_street1, ship_street2, ship_city, ship_state, ship_zip, ship_country, ship_phone, default_length_in, default_width_in, default_height_in, default_weight_oz'
      )
      .eq('id', sellerId)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 })
    }

    if (!seller.ship_street1 || !seller.ship_city || !seller.ship_state || !seller.ship_zip) {
      return NextResponse.json(
        {
          error: `${seller.username || 'This seller'} hasn't finished shipping setup yet, so live rates aren't available for their items right now.`,
          code: 'SELLER_SHIPPING_NOT_SETUP',
          seller_id: sellerId,
        },
        { status: 409 }
      )
    }

    // --- Aggregate the buyer's cart items for this seller into one parcel ---
    const { data: cartItems, error: cartError } = await admin
      .from('cart_items')
      .select('quantity, product:products!inner(id, seller_id, weight_oz)')
      .eq('user_id', user.id)
      .eq('product.seller_id', sellerId)

    if (cartError) throw cartError
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'This seller has no items in your cart.', code: 'SELLER_NOT_IN_CART' },
        { status: 400 }
      )
    }

    const totalWeightOz = cartItems.reduce((sum, item) => {
      const productWeight = (item.product as any)?.weight_oz
      const perUnit =
        typeof productWeight === 'number' && productWeight > 0
          ? productWeight
          : typeof seller.default_weight_oz === 'number' && seller.default_weight_oz > 0
            ? seller.default_weight_oz
            : FALLBACK_ITEM_WEIGHT_OZ
      return sum + perUnit * item.quantity
    }, 0)

    const parcel = {
      length: String(seller.default_length_in || FALLBACK_PARCEL.length),
      width: String(seller.default_width_in || FALLBACK_PARCEL.width),
      height: String(seller.default_height_in || FALLBACK_PARCEL.height),
      distance_unit: 'in' as const,
      weight: String(Math.max(totalWeightOz, 0.1).toFixed(1)),
      mass_unit: 'oz' as const,
    }

    // --- Create the Shippo shipment (returns rates inline) -------------------
    let shipment
    try {
      shipment = await shippoCreateShipment({
        addressFrom: {
          name: seller.ship_name || seller.username || 'Seller',
          street1: seller.ship_street1,
          street2: seller.ship_street2 || undefined,
          city: seller.ship_city,
          state: seller.ship_state,
          zip: seller.ship_zip,
          country: seller.ship_country || 'US',
          email: seller.email || undefined,
          phone: seller.ship_phone || undefined,
          validate: true,
        },
        addressTo: {
          name: toName,
          street1: toStreet1,
          street2: cleanText(address.street2) || undefined,
          city: toCity,
          state: toState,
          zip: toZip,
          country: 'US',
          validate: true,
        },
        parcel,
      })
    } catch (err) {
      console.error('Shippo shipment creation failed:', err)
      return NextResponse.json(
        { error: 'Shipping rates are temporarily unavailable. Please try again in a moment.' },
        { status: 502 }
      )
    }

    const rates = (shipment.rates || []).filter(
      (r: ShippoRate) => r && r.object_id && parseFloat(r.amount) > 0
    )
    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping rates are available for that address. Please check the address and try again.' },
        { status: 502 }
      )
    }

    // --- Curate up to 3 rates ------------------------------------------------
    const byAmount = (a: ShippoRate, b: ShippoRate) => parseFloat(a.amount) - parseFloat(b.amount)
    const cheapestOverall = [...rates].sort(byAmount)[0]
    const cheapestOf = (token: string) =>
      rates.filter((r) => r.servicelevel?.token === token).sort(byAmount)[0]

    const curated: ShippoRate[] = []
    for (const candidate of [
      cheapestOf('usps_ground_advantage'),
      cheapestOf('usps_priority'),
      cheapestOverall,
    ]) {
      if (candidate && !curated.some((r) => r.object_id === candidate.object_id)) {
        curated.push(candidate)
      }
      if (curated.length === 3) break
    }

    return NextResponse.json({
      shipmentId: shipment.object_id,
      rates: curated.map((r) => ({
        rateId: r.object_id,
        carrier: r.provider,
        serviceLevel: r.servicelevel?.name || r.servicelevel?.token || 'Standard',
        amount: parseFloat(r.amount),
        currency: r.currency || 'USD',
        estimatedDays: typeof r.estimated_days === 'number' ? r.estimated_days : null,
      })),
    })
  } catch (error) {
    if (error instanceof ShippoError) {
      console.error('Shippo error:', error.message)
      return NextResponse.json(
        { error: 'Shipping rates are temporarily unavailable. Please try again in a moment.' },
        { status: 502 }
      )
    }
    console.error('Shipping rates API error:', error)
    return NextResponse.json({ error: 'Could not load shipping rates.' }, { status: 500 })
  }
}
