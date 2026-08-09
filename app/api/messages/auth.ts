import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Shared Bearer-token auth for the /api/messages routes, matching the
// pattern used by /api/reports and /api/orders/[id]/label: the client sends
// its Supabase session access token and we validate it with the admin client.
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
