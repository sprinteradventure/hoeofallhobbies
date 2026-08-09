import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import ProductDetailClient from './ProductDetailClient'

export const dynamic = 'force-dynamic'

// ============================================================================
// PRODUCT DETAIL — server wrapper.
// The interactive page is a client component (ProductDetailClient); this
// server component owns SEO: per-product generateMetadata (unique title/
// description/canonical/OG) and schema.org Product JSON-LD.
// ============================================================================

type ProductRow = {
  id: string
  title: string
  description: string | null
  price: number
  condition: string
  quantity: number
  images: string[] | null
  seller: { username: string | null; full_name: string | null; seller_name: string | null } | null
}

async function fetchProduct(id: string): Promise<ProductRow | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('products')
      .select('id, title, description, price, condition, quantity, images, seller:user_profiles(username, full_name, seller_name)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as unknown as ProductRow
  } catch {
    return null
  }
}

function trimDescription(text: string | null, fallback: string): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return fallback
  return clean.length > 155 ? `${clean.slice(0, 152).trimEnd()}...` : clean
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const product = await fetchProduct(params.id)

  if (!product) {
    return {
      title: 'Product not found',
      robots: { index: false },
    }
  }

  const description = trimDescription(
    product.description,
    `${product.title} — craft & hobby supplies on ${SITE_NAME}.`
  )
  const url = `${SITE_URL}/shop/products/${product.id}`
  const images = (product.images || []).filter(Boolean)

  return {
    title: `${product.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${product.title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      images: images.length > 0 ? [{ url: images[0] }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | ${SITE_NAME}`,
      description,
      images: images.length > 0 ? [images[0]] : undefined,
    },
  }
}

function conditionToSchema(condition: string): string {
  switch (condition) {
    case 'new':
      return 'https://schema.org/NewCondition'
    case 'like-new':
      return 'https://schema.org/UsedCondition'
    case 'used':
      return 'https://schema.org/UsedCondition'
    case 'damaged':
      return 'https://schema.org/DamagedCondition'
    default:
      return 'https://schema.org/UsedCondition'
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await fetchProduct(params.id)

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: trimDescription(product.description, product.title),
        image: (product.images || []).filter(Boolean),
        brand: product.seller
          ? {
              '@type': 'Brand',
              name: product.seller.seller_name || product.seller.username || product.seller.full_name || 'Independent Seller',
            }
          : undefined,
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/shop/products/${product.id}`,
          price: product.price.toFixed(2),
          priceCurrency: 'USD',
          availability:
            product.quantity > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: conditionToSchema(product.condition),
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient />
    </>
  )
}
