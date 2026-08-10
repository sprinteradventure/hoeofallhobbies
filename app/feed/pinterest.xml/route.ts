import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { buildFeedXml, FeedProduct } from '@/lib/feedXml'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /feed/pinterest.xml — Pinterest catalog feed.
// RSS 2.0 + Google Merchant namespace (accepted by Pinterest). In-stock
// products with at least one image; g:image_link points at the branded pin
// composite (/api/pin-image/[id]). Pinterest fetches daily; cached 1h at the
// edge. Paste this URL into Pinterest Business > Catalogs > Data sources.
// ============================================================================

const FEED_LIMIT = 2000

export async function GET() {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('products')
      .select('id, title, description, price, condition, quantity, images, category, listing_date')
      .gt('quantity', 0)
      .order('listing_date', { ascending: false })
      .limit(FEED_LIMIT)

    if (error) throw error

    const xml = buildFeedXml((data || []) as FeedProduct[])

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
      },
    })
  } catch (error) {
    console.error('Pinterest feed error:', error)
    return new NextResponse('Feed temporarily unavailable', { status: 500 })
  }
}
