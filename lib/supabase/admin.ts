import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

// Server-only Supabase admin client. NEVER import this from client components
// ('use client') — it uses the service-role key which bypasses RLS.

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server'
    )
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

/**
 * Validate a user access token (from the client's Supabase session) and
 * return the user only if their email is in the ADMIN_EMAILS allowlist.
 * Returns null when the token is invalid or the user is not an admin.
 */
export async function getAdminUserFromToken(
  accessToken: string | null
): Promise<User | null> {
  if (!accessToken) return null

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(accessToken)
  if (error || !data.user?.email) return null

  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowlist.length === 0) return null // no admins configured -> nobody is admin
  return allowlist.includes(data.user.email.toLowerCase()) ? data.user : null
}
