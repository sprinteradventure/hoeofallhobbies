import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { screenListingText, screenOffPlatform } from '@/lib/prohibited-content'

export const dynamic = 'force-dynamic'

// POST /api/listings/[id] — owner-only listing update (R3, edit path).
// Authorization: Bearer <supabase access token>.
// Same screening as creation: prohibited-content scan on title/description,
// off-platform scan on image URL strings, zod validation, and a 30 edits/day
// per-user quota. Ownership is enforced server-side by comparing
// products.seller_id to the authenticated user (service role read, so it
// works even for listings whose RLS the caller couldn't read).
// Fields that must not change here (site, images, seller_id, listing_date)
// are simply not accepted in the schema.

const MAX_EDITS_PER_DAY = 30

const CONDITIONS = ['new', 'like-new', 'used', 'damaged'] as const

const listingUpdateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  price: z.number().min(0.01, 'Price must be at least $0.01').max(9999999),
  condition: z.enum(CONDITIONS),
  quantity: z.number().int().min(1).max(999),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  is_active: z.boolean(),
})

function blockedResponse(matched: string[]) {
  return NextResponse.json(
    {
      error:
        'These changes can\'t be saved because the listing appears to contain: ' +
        matched.join('; ') +
        '. Please edit the title/description and try again.',
      matched,
    },
    { status: 422 }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to edit this listing.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to edit this listing.' }, { status: 401 })
    }
    const user = userData.user

    // ── Rate limit: 30 edits per user per day ─────────────────────────────
    if (!rateLimit(`listings:edit:day:${user.id}`, MAX_EDITS_PER_DAY, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many edits today. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // ── Ownership check (service role, so it can't be skipped via RLS) ────
    const { data: product, error: productError } = await admin
      .from('products')
      .select('id, seller_id, images')
      .eq('id', params.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (product.seller_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own listings.' }, { status: 403 })
    }

    // ── Validate body ─────────────────────────────────────────────────────
    const body = await request.json().catch(() => null)
    const parsed = listingUpdateSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? first.message : 'Invalid listing data.' },
        { status: 400 }
      )
    }
    const data = parsed.data

    // ── Content screening (same rules as creation) ────────────────────────
    const screening = screenListingText(data.title, data.description)
    if (screening.blocked) {
      return blockedResponse(screening.matched)
    }
    const urlScreening = screenOffPlatform((product.images || []).join('\n'))
    if (urlScreening.blocked) {
      return blockedResponse(urlScreening.matched)
    }

    const { error: updateError } = await admin
      .from('products')
      .update({
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        price: data.price,
        condition: data.condition,
        quantity: data.quantity,
        tags: data.tags ?? [],
        is_active: data.is_active,
      })
      .eq('id', params.id)

    if (updateError) throw updateError

    return NextResponse.json({ id: params.id })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ error: 'Failed to update listing.' }, { status: 500 })
  }
}
