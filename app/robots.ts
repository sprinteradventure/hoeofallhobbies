import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-context-server'

// /robots.txt — public catalog crawlable; private + transactional areas blocked.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account',
        '/seller',
        '/admin',
        '/auth',
        '/shop/cart',
        '/shop/checkout',
        '/shop/orders',
        '/api',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
