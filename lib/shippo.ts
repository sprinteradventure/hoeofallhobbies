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
