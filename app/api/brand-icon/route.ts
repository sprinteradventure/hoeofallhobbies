import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

// Per-domain brand icons. Serves the holiday brand (holly-hoe) assets on
// hoeofallholidays.com and the original hobbies assets on hoeofallhobbies.com.
// ?t=icon (512 png, default) | ?t=apple (180 png) | ?t=favicon (ico)
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
  const buf = await readFile(path.join(process.cwd(), 'brand-assets', file))
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.type,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
