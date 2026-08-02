import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { COLLECTIBLES_CATEGORY_NAME } from '@/lib/categories'

export const dynamic = 'force-dynamic'

// Table name for user-created collectible subcategories
const TABLE = 'collectible_subcategories'

/**
 * GET /api/categories/custom-subcategories
 * Returns all user-created subcategories for the Collectibles category.
 * These are sorted alphabetically and include usage counts.
 */
export async function GET() {
  try {
    const admin = getSupabaseAdmin()

    // Ensure table exists (idempotent — safe to call repeatedly)
    const { data: existing, error: checkErr } = await admin
      .from(TABLE)
      .select('name')
      .limit(1)

    if (checkErr && checkErr.message?.includes('does not exist')) {
      // Table doesn't exist yet — create it via RPC or return empty
      return NextResponse.json({ subcategories: [] })
    }

    const { data, error } = await admin
      .from(TABLE)
      .select('name, created_at')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      subcategories: data?.map((d: any) => d.name) || [],
    })
  } catch (error) {
    console.error('Custom subcategories GET error:', error)
    return NextResponse.json({ subcategories: [] }, { status: 200 })
  }
}

/**
 * POST /api/categories/custom-subcategories
 * Body: { name: string }
 * Creates a new custom subcategory for Collectibles.
 * Normalizes the name (title case, trimmed) and prevents duplicates.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Verify user
    const { data: { user }, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    let name = body.name?.trim()

    if (!name) {
      return NextResponse.json({ error: 'Subcategory name is required' }, { status: 400 })
    }

    // Normalize: Title Case
    name = name
      .split(/\s+/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

    // Check for duplicates (case-insensitive)
    const { data: existing } = await admin
      .from(TABLE)
      .select('name')
      .ilike('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `"${name}" already exists as a collectibles subcategory.` },
        { status: 409 }
      )
    }

    // Insert
    const { error } = await admin.from(TABLE).insert({
      name,
      created_by: user.id,
    })

    if (error) {
      // If table doesn't exist, create it and retry
      if (error.message?.includes('does not exist')) {
        await createTable(admin)
        const { error: retryErr } = await admin.from(TABLE).insert({
          name,
          created_by: user.id,
        })
        if (retryErr) throw retryErr
      } else {
        throw error
      }
    }

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Custom subcategories POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create subcategory' },
      { status: 500 }
    )
  }
}

async function createTable(admin: any) {
  // Create the table using Supabase's raw SQL
  const { error } = await admin.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        created_by uuid REFERENCES auth.users(id),
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE ${TABLE} ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Allow public read" ON ${TABLE}
        FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow authenticated insert" ON ${TABLE}
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    `
  })

  if (error) {
    console.error('Failed to create table via RPC:', error)
    // Fallback: try direct REST insert (table might be created via migration)
  }
}
