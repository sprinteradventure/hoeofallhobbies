import { ImageResponse } from 'next/og'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/pin-image/[id] — branded Pinterest pin composite (1000x1500, 2:3).
// Rendered with next/og (satori): cream canvas, HH monogram on top, the
// product's first photo in a white card, a charcoal price badge, and the
// brand name at the bottom. Pinterest crawls these via the catalog feed
// (g:image_link), so they're cached at the edge for a day. Brand colors from
// app/globals.css; default sans font (custom TTFs deliberately skipped).
// ============================================================================

const MONOGRAM_URL = `${SITE_URL}/images/hoe-icon-512.png`

type ProductRow = {
  id: string
  title: string
  price: number
  images: string[] | null
  category: string
}

async function fetchProduct(id: string): Promise<ProductRow | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('products')
      .select('id, title, price, images, category')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as ProductRow
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const product = await fetchProduct(params.id)
  const imageUrl = product?.images?.filter(Boolean)[0] || null

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#faf8f5',
          padding: '56px 56px 48px',
        }}
      >
        {/* Brand icon (white-bg watercolor hoe — rounded badge treatment) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MONOGRAM_URL}
          alt=""
          width={132}
          height={132}
          style={{ objectFit: 'cover', borderRadius: 999, border: '3px solid #ead6ce' }}
        />

        {/* Gold rule */}
        <div style={{ width: 96, height: 2, backgroundColor: '#c9a876', margin: '28px 0 32px' }} />

        {/* Product photo card */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            width: '100%',
            backgroundColor: '#ffffff',
            border: '2px solid #ead6ce',
            borderRadius: 32,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: '#f5f1ed',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9b8a7e',
                fontSize: 36,
              }}
            >
              {product ? 'Photo coming soon' : 'Listing unavailable'}
            </div>
          )}
        </div>

        {/* Category + title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 32,
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#c9a876',
              fontWeight: 700,
            }}
          >
            {product?.category || SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: '#3d4451',
              textAlign: 'center',
              marginTop: 10,
              lineHeight: 1.2,
            }}
          >
            {(product?.title || SITE_NAME).slice(0, 60)}
          </div>
        </div>

        {/* Price badge + brand footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              backgroundColor: '#3d4451',
              color: '#faf8f5',
              fontSize: 40,
              fontWeight: 700,
              padding: '14px 36px',
              borderRadius: 999,
            }}
          >
            {product ? `$${product.price.toFixed(2)}` : ''}
          </div>
          <div style={{ fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', color: '#9b8a7e' }}>
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    }
  )

  return response
}
