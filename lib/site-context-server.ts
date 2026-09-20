import { headers } from 'next/headers'
import { HOBBIES_CATEGORIES, HOLIDAY_CATEGORIES, type CategoryGroup } from './categories'
import type { SiteType } from './site-context'

// ── Server-side helpers ────────────────────────────────────────────────────
// Use these in Server Components, Route Handlers, and API routes.
// They read the x-site-type header set by middleware.ts.

export async function getSiteType(): Promise<SiteType> {
  const h = await headers()
  return (h.get('x-site-type') as SiteType) || 'hobbies'
}

export async function getSiteCategories(): Promise<CategoryGroup[]> {
  const siteType = await getSiteType()
  return siteType === 'holidays' ? HOLIDAY_CATEGORIES : HOBBIES_CATEGORIES
}

export async function getSiteName(): Promise<string> {
  const siteType = await getSiteType()
  return siteType === 'holidays'
    ? 'Hoe of All Holidays'
    : 'Hoe of All Hobbies'
}

export async function getSiteUrl(): Promise<string> {
  const siteType = await getSiteType()
  return siteType === 'holidays'
    ? 'https://www.hoeofallholidays.com'
    : 'https://www.hoeofallhobbies.com'
}

export async function getSiteDescription(): Promise<string> {
  const siteType = await getSiteType()
  return siteType === 'holidays'
    ? 'Discover and sell holiday decor, party supplies, and celebration essentials for every culture, tradition, and occasion.'
    : 'Discover and sell unique craft and hobby supplies on our curated marketplace.'
}

// Synchronous version for API routes that already have the host string
export function getSiteIdentity(host?: string | null) {
  const isHoliday =
    host === 'hoeofallholidays.com' ||
    host === 'www.hoeofallholidays.com' ||
    host === 'localhost:3001'

  if (isHoliday) {
    return {
      SITE_NAME: 'Hoe of All Holidays',
      SITE_URL: 'https://www.hoeofallholidays.com',
      SITE_DESCRIPTION:
        'Discover and sell holiday decor, party supplies, and celebration essentials for every culture, tradition, and occasion.',
      DEFAULT_OG_IMAGE: '/og-image.png',
    }
  }

  return {
    SITE_NAME: 'Hoe of All Hobbies',
    SITE_URL: 'https://www.hoeofallhobbies.com',
    SITE_DESCRIPTION:
      'Discover and sell unique craft and hobby supplies on our curated marketplace.',
    DEFAULT_OG_IMAGE: '/og-image.png',
  }
}
