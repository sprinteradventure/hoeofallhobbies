'use client'

import { useSiteType } from '@/lib/site-context'

// Brand lockup used at the top of auth pages. Shows the holidays wreath
// logo on hoeofallholidays.com and the hobbies logo on hoeofallhobbies.com.
// Pass isHolidays from a Server Component to render the right logo on the
// server (no flash); when omitted it falls back to the site-type cookie.
export default function AuthBrandLogo({ isHolidays: isHolidaysProp }: { isHolidays?: boolean }) {
  const siteType = useSiteType()
  const isHolidays = isHolidaysProp ?? siteType === 'holidays'
  return (
    <img
      src={isHolidays ? '/images/holidays-logo.png' : '/images/logo-of-all.png'}
      alt={isHolidays ? 'Hoe of All Holidays' : 'Hoe of All Hobbies'}
      className="h-12 mx-auto mb-4 object-contain"
    />
  )
}
