// ============================================================================
// Pinterest catalog feed — pure XML builder (no I/O, unit-testable).
// RSS 2.0 with the Google Merchant `g:` namespace, which Pinterest accepts
// for catalog ingestion. Used by app/feed/pinterest.xml/route.ts.
// Tenant-aware: the caller passes the marketplace identity (name + base URL).
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

export interface FeedIdentity {
  name: string
  url: string
  description: string
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

export function pinImageUrl(productId: string, siteUrl: string): string {
  return `${siteUrl}/api/pin-image/${productId}`
}

export function productUrl(productId: string, siteUrl: string): string {
  return `${siteUrl}/shop/products/${productId}`
}

function itemXml(p: FeedProduct, identity: FeedIdentity): string {
  const images = (p.images || []).filter(Boolean)
  return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(cleanText(p.title, 'Untitled listing', 150))}</title>
      <g:description>${escapeXml(cleanText(p.description, p.title, 5000, true))}</g:description>
      <link>${escapeXml(productUrl(p.id, identity.url))}</link>
      <g:image_link>${escapeXml(pinImageUrl(p.id, identity.url))}</g:image_link>
      <g:additional_image_link>${escapeXml(images[0])}</g:additional_image_link>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>${feedCondition(p.condition)}</g:condition>
      <g:brand>${escapeXml(identity.name)}</g:brand>
      <g:product_type>${escapeXml(p.category)}</g:product_type>
    </item>`
}

export function buildFeedXml(products: FeedProduct[], identity: FeedIdentity): string {
  // Feed contract: in-stock items with at least one image only.
  const items = products
    .filter((p) => p.quantity > 0 && (p.images || []).filter(Boolean).length > 0)
    .map((p) => itemXml(p, identity))
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(identity.name)}</title>
    <link>${escapeXml(identity.url)}</link>
    <description>${escapeXml(identity.description)}</description>
${items}
  </channel>
</rss>
`
}
