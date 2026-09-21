import { NextRequest, NextResponse } from 'next/server'

// Per-domain brand icons. Serves the holiday brand (holly-hoe) assets on
// hoeofallholidays.com and the original hobbies assets on hoeofallhobbies.com.
// ?t=icon (512 png, default) | ?t=apple (180 png) | ?t=favicon (ico)
// Assets live in /public/brand-assets and are fetched through the site's own
// CDN so this works on serverless (no direct filesystem access needed).
const ASSETS: Record<string, { holidays: string; hobbies: string; type: string }> = {
  icon: {
    holidays: 'icon-holidays.png',
    hobbies: 'icon-hobbies.png',
    type: 'image/png',
  },
  apple: {
    holidays: 'apple-icon-holidays.png',
    hobbies: 'apple-icon-hobbies.png',
    type: 'image/png',
  },
  favicon: {
    holidays: 'favicon-holidays.ico',
    hobbies: 'favicon-hobbies.ico',
    type: 'image/x-icon',
  },
}

export async function GET(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get('t') || 'icon'
  const asset = ASSETS[variant] || ASSETS.icon
  const host = req.headers.get('host') || ''
  const isHoliday =
    host === 'hoeofallholidays.com' ||
    host === 'www.hoeofallholidays.com' ||
    host === 'localhost:3001'
  const file = isHoliday ? asset.holidays : asset.hobbies

  const upstream = await fetch(new URL(`/brand-assets/${file}`, req.url), {
    // The assets are immutable; skip revalidation overhead.
    cache: 'no-store',
  })
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Icon asset missing', { status: 404 })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': asset.type,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
