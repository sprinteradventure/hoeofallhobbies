import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/site-context-server'

export const dynamic = 'force-dynamic'

// /sitemap.xml — static public routes + every active product listing.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/shop`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/shop/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/categories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/sell`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const admin = getSupabaseAdmin()
    const { data: products, error } = await admin
      .from('products')
      .select('id, updated_at, listing_date')
      .eq('is_active', true)
      .order('listing_date', { ascending: false })

    if (error) throw error

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((p: any) => ({
      url: `${siteUrl}/shop/products/${p.id}`,
      lastModified: p.updated_at || p.listing_date || undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticRoutes, ...productRoutes]
  } catch (err) {
    // Never let a sitemap failure 500 — static routes alone are still valid.
    console.error('Sitemap product fetch failed:', err)
    return staticRoutes
  }
}
