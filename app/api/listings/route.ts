import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { getSiteType } from '@/lib/site-context-server'
import { screenListingText, screenOffPlatform } from '@/lib/prohibited-content'

export const dynamic = 'force-dynamic'

// POST /api/listings — server-side listing creation (R3).
// Authorization: Bearer <supabase access token> (validated via service role).
// The browser used to insert straight into `products` with the anon key; this
// route adds zod validation, prohibited-content screening, off-platform
// screening (text + image URLs), image-count caps, and per-user quotas.
//
// Rate limits (per user, in-memory sliding window — see lib/rate-limit.ts):
//   - 10 new listings / 24h
//   - 3 new listings / 1h  (tuned down from the daily cap to stop bursts;
//                            note: legitimate sellers batch-listing more than
//                            3 items in an hour will hit this — raise to 5/h
//                            if it becomes a support ticket)
// On screened (422) failures we return matched CATEGORY labels only — never
// the raw banned words, so the endpoint can't be used as an oracle to
// reverse-engineer the blocklist.

const MAX_LISTINGS_PER_DAY = 10
const MAX_LISTINGS_PER_HOUR = 3

const CONDITIONS = ['new', 'like-new', 'used', 'damaged'] as const

const listingSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  price: z.number().min(0.01, 'Price must be at least $0.01').max(9999999),
  condition: z.enum(CONDITIONS),
  quantity: z.number().int().min(1).max(999),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).nullable().optional(),
  categories: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
  subcategories: z.array(z.string().trim().max(100)).max(30).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  images: z.array(z.string().max(2048)).max(10, 'Maximum 10 images'),
  video_url: z.string().max(2048).nullable().optional(),
  weight_oz: z.number().positive().max(10000),
  length_in: z.number().positive().max(1000).nullable().optional(),
  width_in: z.number().positive().max(1000).nullable().optional(),
  height_in: z.number().positive().max(1000).nullable().optional(),
})

function blockedResponse(matched: string[]) {
  return NextResponse.json(
    {
      error:
        'This listing can\'t be published because it appears to contain: ' +
        matched.join('; ') +
        '. Please edit the title/description and try again.',
      matched,
    },
    { status: 422 }
  )
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth: Bearer session token, validated with the service role ──────
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to create a listing.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to create a listing.' }, { status: 401 })
    }
    const user = userData.user

    // ── Rate limits (before validation work) ──────────────────────────────
    if (!rateLimit(`listings:create:day:${user.id}`, MAX_LISTINGS_PER_DAY, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: `You can create up to ${MAX_LISTINGS_PER_DAY} listings per day. Please try again tomorrow.` },
        { status: 429 }
      )
    }
    if (!rateLimit(`listings:create:hour:${user.id}`, MAX_LISTINGS_PER_HOUR, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'You are creating listings too quickly. Please wait a little and try again.' },
        { status: 429 }
      )
    }

    // ── Validate body ─────────────────────────────────────────────────────
    const body = await request.json().catch(() => null)
    const parsed = listingSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? first.message : 'Invalid listing data.' },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Site is taken from the x-site-type header (set by middleware) with a
    // Host fallback — never trusted from the client body. See
    // lib/site-context-server.ts getSiteType().
    const site = await getSiteType()

    // ── Content screening ─────────────────────────────────────────────────
    const screening = screenListingText(data.title, data.description)
    if (screening.blocked) {
      return blockedResponse(screening.matched)
    }
    // Image URL strings are also scanned for off-platform redirection.
    const urlScreening = screenOffPlatform(data.images.join('\n'))
    if (urlScreening.blocked) {
      return blockedResponse(urlScreening.matched)
    }

    // ── Service-role insert (RLS bypassed; seller_id forced server-side) ──
    const { data: product, error: insertError } = await admin
      .from('products')
      .insert({
        seller_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        categories: data.categories ?? [data.category],
        subcategories: data.subcategories ?? [],
        site,
        price: data.price,
        condition: data.condition,
        quantity: data.quantity,
        tags: data.tags ?? [],
        weight_oz: data.weight_oz,
        length_in: data.length_in ?? null,
        width_in: data.width_in ?? null,
        height_in: data.height_in ?? null,
        is_active: true,
        listing_date: new Date().toISOString(),
        images: data.images,
        video_url: data.video_url ?? null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: product.id }, { status: 201 })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Failed to create listing.' }, { status: 500 })
  }
}
