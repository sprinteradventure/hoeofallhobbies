// Server-only Shippo REST helper. NEVER import from client components —
// it reads SHIPPO_API_KEY. All marketplace Shippo calls go through here.
// Docs: https://goshippo.com/docs/reference

import type { SupabaseClient } from '@supabase/supabase-js'

const SHIPPO_BASE = 'https://api.goshippo.com'

export type ShippoAddress = {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  email?: string
  phone?: string
  validate?: boolean
}

export type ShippoParcel = {
  length: string
  width: string
  height: string
  distance_unit: 'in'
  weight: string
  mass_unit: 'oz'
}

export type ShippoRate = {
  object_id: string
  shipment: string
  amount: string
  currency: string
  provider: string
  servicelevel: { token?: string; name?: string }
  estimated_days: number | null
}

export class ShippoError extends Error {
  status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.status = status
  }
}

function apiKey(): string {
  const key = process.env.SHIPPO_API_KEY
  if (!key) {
    throw new ShippoError('Shipping is not configured yet (missing SHIPPO_API_KEY).')
  }
  return key
}

async function shippoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${SHIPPO_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `ShippoToken ${apiKey()}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch (err) {
    throw new ShippoError('Could not reach the shipping provider.')
  }

  const body: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail =
      body?.detail ||
      (typeof body === 'object' ? JSON.stringify(body).slice(0, 300) : '') ||
      `HTTP ${res.status}`
    throw new ShippoError(`Shipping provider error: ${detail}`, res.status)
  }
  return body as T
}

export async function shippoCreateShipment(input: {
  addressFrom: ShippoAddress
  addressTo: ShippoAddress
  parcel: ShippoParcel
}): Promise<{ object_id: string; rates: ShippoRate[] }> {
  const shipment = await shippoFetch<any>('/shipments/', {
    method: 'POST',
    body: JSON.stringify({
      address_from: input.addressFrom,
      address_to: input.addressTo,
      parcels: [input.parcel],
      async: false,
    }),
  })
  return { object_id: shipment.object_id, rates: shipment.rates || [] }
}

export async function shippoGetRate(rateId: string): Promise<ShippoRate> {
  return shippoFetch<ShippoRate>(`/rates/${rateId}/`)
}

export async function shippoGetShipment(shipmentId: string): Promise<any> {
  return shippoFetch<any>(`/shipments/${shipmentId}/`)
}

export async function shippoCreateTransaction(rateId: string): Promise<{
  object_id: string
  status: string
  label_url?: string
  tracking_number?: string
  tracking_url_provider?: string
  messages?: Array<{ text?: string }>
}> {
  return shippoFetch('/transactions/', {
    method: 'POST',
    body: JSON.stringify({ rate: rateId, label_file_type: 'PDF', async: false }),
  })
}

// ============================================================================
// purchaseLabelForOrder — the ONE implementation for buying a Shippo label.
// Used by the Stripe webhook (automatic, after payment) and by
// POST /api/orders/[id]/label (manual retry from the seller orders page).
// Never throws for carrier-side failures: returns { ok: false, message }
// with Shippo's own error text (e.g. missing billing method) so callers can
// surface it. Throws only for unexpected/DB errors.
// ============================================================================

export type LabelPurchaseResult =
  | {
      ok: true
      transactionId: string
      labelUrl: string | null
      trackingNumber: string | null
      trackingUrl: string | null
    }
  | { ok: false; message: string }

export async function purchaseLabelForOrder(
  admin: SupabaseClient,
  order: { id: string; shippo_rate_id: string }
): Promise<LabelPurchaseResult> {
  let txn
  try {
    txn = await shippoCreateTransaction(order.shippo_rate_id)
  } catch (err) {
    const message =
      err instanceof ShippoError
        ? err.message
        : 'Could not reach the shipping provider. Please try again.'
    return { ok: false, message }
  }

  if (txn.status !== 'SUCCESS') {
    const detail = (txn.messages || [])
      .map((m) => m?.text)
      .filter(Boolean)
      .join(' ')
    return {
      ok: false,
      message:
        detail ||
        `The shipping provider could not create the label (status ${txn.status}). Please try again or contact support.`,
    }
  }

  const { error: updateError } = await admin
    .from('orders')
    .update({
      shippo_transaction_id: txn.object_id,
      label_url: txn.label_url ?? null,
      tracking_number: txn.tracking_number ?? null,
      tracking_url: txn.tracking_url_provider ?? null,
    })
    .eq('id', order.id)

  if (updateError) throw updateError

  return {
    ok: true,
    transactionId: txn.object_id,
    labelUrl: txn.label_url ?? null,
    trackingNumber: txn.tracking_number ?? null,
    trackingUrl: txn.tracking_url_provider ?? null,
  }
}

// ============================================================================
// requoteAndPurchaseLabel — self-healing fallback for stale shipments.
// Shippo shipments are immutable: an order whose shipment was created before
// the from-address carried email/phone (or whose rate expired) can never buy
// a label against the stored rate. This rebuilds a FRESH shipment from the
// seller's current ship-from profile (with account email + ship_phone) and
// the order's stored shipping_address, picks the same service level (else
// cheapest), sanity-checks the new price against what the buyer paid, buys
// the label, and re-points the order at the new shipment/rate.
// Returns { ok: false, message } for any carrier-side failure; throws only
// for unexpected/DB errors.
// ============================================================================

const REQUOTE_FALLBACK_PARCEL = { length: 9, width: 6, height: 3 }
const REQUOTE_FALLBACK_ITEM_WEIGHT_OZ = 8
const REQUOTE_MAX_PRICE_INCREASE = 2.0

export async function requoteAndPurchaseLabel(
  admin: SupabaseClient,
  order: {
    id: string
    seller_id: string
    shipping_address: Record<string, any> | null
    shipping_service_level: string | null
    shipping_cost: number | null
  }
): Promise<LabelPurchaseResult> {
  // --- Seller ship-from (with email + phone — the USPS requirement) ----------
  const { data: seller, error: sellerError } = await admin
    .from('user_profiles')
    .select(
      'username, email, ship_name, ship_street1, ship_street2, ship_city, ship_state, ship_zip, ship_country, ship_phone, default_length_in, default_width_in, default_height_in, default_weight_oz'
    )
    .eq('id', order.seller_id)
    .single()

  if (sellerError || !seller) throw sellerError || new Error('Seller not found')

  if (!seller.ship_street1 || !seller.ship_city || !seller.ship_state || !seller.ship_zip) {
    return {
      ok: false,
      message: 'The seller has no ship-from address on file, so the shipment cannot be re-quoted.',
    }
  }

  const addr = order.shipping_address
  if (!addr?.city || !addr?.state || !addr?.zip || !(addr?.address || addr?.street1)) {
    return {
      ok: false,
      message: 'This order has no complete shipping address on file, so the shipment cannot be re-quoted.',
    }
  }

  // --- Aggregate the order's items into one parcel (same rules as quoting) ---
  const { data: items, error: itemsError } = await admin
    .from('order_items')
    .select('quantity, product:products(id, weight_oz)')
    .eq('order_id', order.id)

  if (itemsError) throw itemsError

  const totalWeightOz = (items || []).reduce((sum: number, item: any) => {
    const productWeight = item.product?.weight_oz
    const perUnit =
      typeof productWeight === 'number' && productWeight > 0
        ? productWeight
        : typeof seller.default_weight_oz === 'number' && seller.default_weight_oz > 0
          ? seller.default_weight_oz
          : REQUOTE_FALLBACK_ITEM_WEIGHT_OZ
    return sum + perUnit * item.quantity
  }, 0)

  const parcel: ShippoParcel = {
    length: String(seller.default_length_in || REQUOTE_FALLBACK_PARCEL.length),
    width: String(seller.default_width_in || REQUOTE_FALLBACK_PARCEL.width),
    height: String(seller.default_height_in || REQUOTE_FALLBACK_PARCEL.height),
    distance_unit: 'in',
    weight: String(Math.max(totalWeightOz, 0.1).toFixed(1)),
    mass_unit: 'oz',
  }

  // --- Create the fresh shipment ---------------------------------------------
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
        name: addr.fullName || addr.name || 'Buyer',
        street1: addr.address || addr.street1,
        street2: addr.address2 || addr.street2 || undefined,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
        validate: true,
      },
      parcel,
    })
  } catch (err) {
    const message =
      err instanceof ShippoError ? err.message : 'Could not reach the shipping provider.'
    return { ok: false, message: `Re-quote failed: ${message}` }
  }

  const rates = (shipment.rates || []).filter(
    (r: ShippoRate) => r && r.object_id && parseFloat(r.amount) > 0
  )
  if (rates.length === 0) {
    return { ok: false, message: 'Re-quote produced no rates for this shipment. Needs manual review.' }
  }

  // --- Pick the same service level the buyer paid for, else cheapest ---------
  const byAmount = (a: ShippoRate, b: ShippoRate) => parseFloat(a.amount) - parseFloat(b.amount)
  const wanted = (order.shipping_service_level || '').trim().toLowerCase()
  const rateName = (r: ShippoRate) =>
    `${r.provider} ${r.servicelevel?.name || r.servicelevel?.token || ''}`.trim().toLowerCase()

  const chosen =
    (wanted &&
      (rates.find((r) => rateName(r) === wanted) ||
        rates.find((r) => wanted && rateName(r).includes(wanted)) ||
        rates.find((r) => rateName(r) && wanted.includes(rateName(r))))) ||
    [...rates].sort(byAmount)[0]

  // --- Price sanity check: buyer already paid shipping_cost ------------------
  const freshAmount = parseFloat(chosen.amount)
  if (
    order.shipping_cost != null &&
    freshAmount - Number(order.shipping_cost) > REQUOTE_MAX_PRICE_INCREASE
  ) {
    return {
      ok: false,
      message: `Re-quoted rate is $${freshAmount.toFixed(2)} but the buyer paid $${Number(order.shipping_cost).toFixed(2)} — rate increased, needs manual review.`,
    }
  }

  // --- Buy the label against the fresh rate -----------------------------------
  let txn
  try {
    txn = await shippoCreateTransaction(chosen.object_id)
  } catch (err) {
    const message =
      err instanceof ShippoError ? err.message : 'Could not reach the shipping provider.'
    return { ok: false, message: `Re-quote succeeded but label purchase failed: ${message}` }
  }

  if (txn.status !== 'SUCCESS') {
    const detail = (txn.messages || [])
      .map((m) => m?.text)
      .filter(Boolean)
      .join(' ')
    return {
      ok: false,
      message: `Re-quote succeeded but label purchase failed: ${detail || `status ${txn.status}`}`,
    }
  }

  const freshServiceLevel = `${chosen.provider} ${chosen.servicelevel?.name || chosen.servicelevel?.token || 'Standard'}`
  const { error: updateError } = await admin
    .from('orders')
    .update({
      shippo_shipment_id: shipment.object_id,
      shippo_rate_id: chosen.object_id,
      shipping_service_level: freshServiceLevel,
      shippo_transaction_id: txn.object_id,
      label_url: txn.label_url ?? null,
      tracking_number: txn.tracking_number ?? null,
      tracking_url: txn.tracking_url_provider ?? null,
    })
    .eq('id', order.id)

  if (updateError) throw updateError

  return {
    ok: true,
    transactionId: txn.object_id,
    labelUrl: txn.label_url ?? null,
    trackingNumber: txn.tracking_number ?? null,
    trackingUrl: txn.tracking_url_provider ?? null,
  }
}
