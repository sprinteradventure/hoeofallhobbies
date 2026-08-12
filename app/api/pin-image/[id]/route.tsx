import { ImageResponse } from 'next/og'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SITE_NAME } from '@/lib/site'

// Edge runtime: canonical for ImageResponse and avoids a @vercel/og Windows
// path bug (its embedded fallback font fails fileURLToPath when the project
// path contains spaces). Supabase REST + font fetches are edge-safe.
export const runtime = 'edge'

// ============================================================================
// GET /api/pin-image/[id] — branded Pinterest pin composite (1000x1500, 2:3).
// A static PIL-rendered template (public/images/pin-template.png, see
// scripts/make_pin_template.py) carries everything that never changes —
// masthead, ribbon bookmark, botanicals, photo mat, pill + price-badge
// shapes, footer band, icon circle. This route overlays ONLY the dynamic
// slots below, which must match the template's constants:
//   PHOTO_BOX = (74, 344, 926, 1006)   product photo, object-fit cover
//   PILL_BOX  = (330, 996, 670, 1046)  category text (shape baked in)
//   TITLE_BOX = (100, 1058, 900, 1248) serif title, up to 2 lines
//   PRICE_BOX = (56, 1408, 264, 1470)  price text inside the badge
// Fonts load from /public/fonts at request origin so local dev and prod both
// work; on any font failure the default sans is used. Cache: 1 day at edge.
// ============================================================================

const TEMPLATE_PATH = '/images/pin-template.png'

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

async function loadFont(origin: string, file: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${origin}/fonts/${file}`)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

function titleFontSize(title: string): number {
  if (title.length <= 20) return 62
  if (title.length <= 36) return 52
  return 44
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = new URL(request.url).origin
  const product = await fetchProduct(params.id)
  const imageUrl = product?.images?.filter(Boolean)[0] || null

  const [playfair, playfairBold] = await Promise.all([
    loadFont(origin, 'PlayfairDisplay-Regular.ttf'),
    loadFont(origin, 'PlayfairDisplay-Bold.ttf'),
  ])
  const fonts = [
    ...(playfair ? [{ name: 'Playfair Display', data: playfair, weight: 400 as const }] : []),
    ...(playfairBold ? [{ name: 'Playfair Display', data: playfairBold, weight: 700 as const }] : []),
  ]

  const title = (product?.title || SITE_NAME).slice(0, 90)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          backgroundColor: '#faf6f1',
        }}
      >
        {/* Static branded template (masthead, frame, botanicals, footer) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}${TEMPLATE_PATH}`}
          alt=""
          width={1000}
          height={1500}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />

        {/* Product photo — framed slot, cover fit */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              left: 74,
              top: 344,
              width: 852,
              height: 662,
              objectFit: 'cover',
            }}
          />
        )}

        {/* Category pill text (pill shape is baked into the template) */}
        {product && (
          <div
            style={{
              position: 'absolute',
              left: 330,
              top: 996,
              width: 340,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#faf6f1',
              fontSize: 20,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontFamily: 'Playfair Display',
              fontWeight: 400,
            }}
          >
            {product.category}
          </div>
        )}

        {/* Serif title, up to 2 lines, auto-shrunk for long titles */}
        <div
          style={{
            position: 'absolute',
            left: 100,
            top: 1058,
            width: 800,
            height: 190,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#3d4451',
            fontFamily: 'Playfair Display',
            fontWeight: 700,
            fontSize: titleFontSize(title),
            lineHeight: 1.15,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Price inside the ornate bottom-left badge */}
        {product && (
          <div
            style={{
              position: 'absolute',
              left: 56,
              top: 1408,
              width: 208,
              height: 62,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#faf6f1',
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: 40,
            }}
          >
            {`$${product.price.toFixed(2)}`}
          </div>
        )}
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      fonts,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    }
  )
}
