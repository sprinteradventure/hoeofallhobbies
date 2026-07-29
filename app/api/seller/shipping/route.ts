import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// SELLER SHIPPING SETTINGS — LIVE
// ----------------------------------------------------------------------------
// POST /api/seller/shipping
// Authorization: Bearer <supabase access token>
// Saves the seller's ship-from address and default parcel onto their own
// user_profiles row. This address is the Shippo address_from for every rate
// quote and label; the default parcel is used whenever a listing has no
// weight/dimension overrides of its own.
// ============================================================================

const REQUIRED_FIELDS = ['ship_name', 'ship_street1', 'ship_city', 'ship_state', 'ship_zip'] as const

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanPositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) && n > 0 ? n : null
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

    const update: Record<string, unknown> = {}
    for (const field of REQUIRED_FIELDS) {
      const value = cleanText(body?.[field])
      if (!value) {
        return NextResponse.json(
          { error: `Missing required field: ${field.replace('ship_', '').replace('_', ' ')}.` },
          { status: 400 }
        )
      }
      update[field] = value
    }
    update.ship_street2 = cleanText(body?.ship_street2)
    update.ship_country = cleanText(body?.ship_country) || 'US'

    // Phone is optional but required by carriers (USPS) at label-purchase
    // time. Loose format check when provided: 7-20 chars of digits/+-()/space.
    const rawPhone = cleanText(body?.ship_phone)
    if (rawPhone && !/^[0-9+\-() ]{7,20}$/.test(rawPhone)) {
      return NextResponse.json(
        { error: 'Phone must be 7–20 characters (digits, +, -, parentheses, spaces).' },
        { status: 400 }
      )
    }
    update.ship_phone = rawPhone

    // Default parcel is optional but each provided dimension must be a
    // positive number; invalid numbers are rejected rather than saved.
    const parcelFields = [
      'default_length_in',
      'default_width_in',
      'default_height_in',
      'default_weight_oz',
    ] as const
    for (const field of parcelFields) {
      const raw = body?.[field]
      if (raw === null || raw === undefined || raw === '') {
        update[field] = null
        continue
      }
      const n = cleanPositiveNumber(raw)
      if (n === null) {
        return NextResponse.json(
          { error: `Parcel field ${field.replace(/_/g, ' ')} must be a positive number.` },
          { status: 400 }
        )
      }
      update[field] = n
    }

    const { error: updateError } = await admin
      .from('user_profiles')
      .update(update)
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Seller shipping settings error:', error)
    return NextResponse.json({ error: 'Failed to save shipping settings.' }, { status: 500 })
  }
}
