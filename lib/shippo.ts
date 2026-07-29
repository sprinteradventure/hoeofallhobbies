// Server-only Shippo REST helper. NEVER import from client components —
// it reads SHIPPO_API_KEY. All marketplace Shippo calls go through here.
// Docs: https://goshippo.com/docs/reference

const SHIPPO_BASE = 'https://api.goshippo.com'

export type ShippoAddress = {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
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
