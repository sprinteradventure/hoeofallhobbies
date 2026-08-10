import { SITE_NAME, SITE_URL } from './site'

// ============================================================================
// Pinterest catalog feed — pure XML builder (no I/O, unit-testable).
// RSS 2.0 with the Google Merchant `g:` namespace, which Pinterest accepts
// for catalog ingestion. Used by app/feed/pinterest.xml/route.ts.
// ============================================================================

export interface FeedProduct {
  id: string
  title: string
  description: string | null
  price: number
  condition: string
  quantity: number
  images: string[] | null
  category: string
  listing_date?: string
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ')
}

function cleanText(value: string | null, fallback: string, max: number, stripTags = false): string {
  const raw = stripTags ? stripHtml(value || '') : (value || '')
  const clean = raw.replace(/\s+/g, ' ').trim() || fallback
  return clean.length > max ? clean.slice(0, max).trimEnd() : clean
}

/** Map the site's condition enum to Google's new/used/refurbished. */
export function feedCondition(condition: string): string {
  return condition === 'new' ? 'new' : 'used'
}

export function pinImageUrl(productId: string): string {
  return `${SITE_URL}/api/pin-image/${productId}`
}

export function productUrl(productId: string): string {
  return `${SITE_URL}/shop/products/${productId}`
}

function itemXml(p: FeedProduct): string {
  const images = (p.images || []).filter(Boolean)
  return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(cleanText(p.title, 'Untitled listing', 150))}</title>
      <g:description>${escapeXml(cleanText(p.description, p.title, 5000, true))}</g:description>
      <link>${escapeXml(productUrl(p.id))}</link>
      <g:image_link>${escapeXml(pinImageUrl(p.id))}</g:image_link>
      <g:additional_image_link>${escapeXml(images[0])}</g:additional_image_link>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>${feedCondition(p.condition)}</g:condition>
      <g:brand>${escapeXml(SITE_NAME)}</g:brand>
      <g:product_type>${escapeXml(p.category)}</g:product_type>
    </item>`
}

export function buildFeedXml(products: FeedProduct[]): string {
  // Feed contract: in-stock items with at least one image only.
  const items = products
    .filter((p) => p.quantity > 0 && (p.images || []).filter(Boolean).length > 0)
    .map(itemXml)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Craft and hobby supplies from ${escapeXml(SITE_NAME)}</description>
${items}
  </channel>
</rss>
`
}
