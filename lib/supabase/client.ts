import type { SupabaseClient } from '@supabase/supabase-js'

// Browser Supabase client, exposed as a lazy Proxy.
//
// Why lazy: creating the client at module scope breaks server-side rendering
// whenever a client component that imports this module is rendered from a
// Server Component ("Element type is invalid: ... got: undefined" 500s —
// seen on /auth/* and /shop/products/[id]). Instantiating on first property
// access keeps module import side-effect-free, so SSR never touches
// supabase-js. All existing call sites (`supabase.auth.signIn...`,
// `supabase.from(...)`) keep working unchanged.
let cached: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js')
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
    ) as SupabaseClient
  }
  return cached
}

function getProp(target: SupabaseClient, prop: string | symbol): unknown {
  const value = (target as unknown as Record<string | symbol, unknown>)[prop]
  return typeof value === 'function' ? (value as Function).bind(target) : value
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getProp(getClient(), prop)
  },
  has(_target, prop) {
    return prop in getClient()
  },
})
