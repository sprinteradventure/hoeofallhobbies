import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/me
// Authorization: Bearer <supabase access token>
// Returns { isAdmin: boolean } — 200 in both cases. ADMIN_EMAILS is the
// single source of truth; this client-facing check never exposes the list.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  const adminUser = await getAdminUserFromToken(token)
  return NextResponse.json({ isAdmin: !!adminUser })
}
