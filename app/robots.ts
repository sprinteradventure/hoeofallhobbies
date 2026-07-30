import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// /robots.txt — public catalog crawlable; private + transactional areas blocked.
export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
