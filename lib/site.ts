// Shared site identity for SEO surfaces (sitemap, robots, metadata, JSON-LD).
// Uses NEXT_PUBLIC_APP_URL when set (matches the repo's existing pattern),
// falling back to the production domain.

export const SITE_NAME = 'Hoe of All Hobbies'
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'
export const SITE_DESCRIPTION =
  'Discover and sell unique craft and hobby supplies on our curated marketplace.'
export const DEFAULT_OG_IMAGE = '/og-image.png'
