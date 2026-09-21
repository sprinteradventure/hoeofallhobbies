import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy accessor for the browser Supabase client.
// Auth pages are SSR'd from a Server Component wrapper; importing the
// singleton client module at the top of those client components breaks
// server rendering ("Element type is invalid"), so we import supabase-js
// on demand instead. The created client is cached after first use.
let cached: SupabaseClient | null = null

export async function getSupabase(): Promise<SupabaseClient> {
  if (!cached) {
    const { createClient } = await import('@supabase/supabase-js')
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
    )
  }
  return cached
}
