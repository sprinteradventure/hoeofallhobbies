'use client'

import { useSiteType } from '@/lib/site-context'

// Brand lockup used at the top of auth pages. Shows the holidays wreath
// logo on hoeofallholidays.com and the hobbies logo on hoeofallhobbies.com.
export default function AuthBrandLogo() {
  const siteType = useSiteType()
  const isHolidays = siteType === 'holidays'
  return (
    <img
      src={isHolidays ? '/images/holidays-logo.png' : '/images/logo-of-all.png'}
      alt={isHolidays ? 'Hoe of All Holidays' : 'Hoe of All Hobbies'}
      className="h-12 mx-auto mb-4 object-contain"
    />
  )
}
