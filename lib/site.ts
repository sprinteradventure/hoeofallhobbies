// Shared site identity for SEO surfaces (sitemap, robots, metadata, JSON-LD).
// Uses NEXT_PUBLIC_APP_URL when set (matches the repo's existing pattern),
// falling back to the production domain.

// Hobbies (default) branding
const HOBBIES_NAME = 'Hoe of All Hobbies'
const HOBBIES_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'
const HOBBIES_DESCRIPTION =
  'Discover and sell unique craft and hobby supplies on our curated marketplace.'

// Holidays branding
const HOLIDAYS_NAME = 'Hoe of All Holidays'
const HOLIDAYS_URL = 'https://www.hoeofallholidays.com'
const HOLIDAYS_DESCRIPTION =
  'Discover and sell holiday decor, party supplies, and celebration essentials for every culture, tradition, and occasion.'

export const DEFAULT_OG_IMAGE = '/og-image.png'

// Server-side helper: call in Server Components / Route Handlers / API routes
export function getSiteIdentity(host?: string | null) {
  const isHoliday =
    host === 'hoeofallholidays.com' ||
    host === 'www.hoeofallholidays.com' ||
    host === 'localhost:3001'

  if (isHoliday) {
    return {
      SITE_NAME: HOLIDAYS_NAME,
      SITE_URL: HOLIDAYS_URL,
      SITE_DESCRIPTION: HOLIDAYS_DESCRIPTION,
      DEFAULT_OG_IMAGE,
    }
  }

  return {
    SITE_NAME: HOBBIES_NAME,
    SITE_URL: HOBBIES_URL,
    SITE_DESCRIPTION: HOBBIES_DESCRIPTION,
    DEFAULT_OG_IMAGE,
  }
}

// Static exports for legacy code paths that cannot detect domain at runtime.
// In a Server Component context prefer getSiteIdentity(headers().get('host')).
export const SITE_NAME = HOBBIES_NAME
export const SITE_URL = HOBBIES_URL
export const SITE_DESCRIPTION = HOBBIES_DESCRIPTION
