import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /api/admin/sellers/[id]/verify
// Authorization: Bearer <supabase access token>
// Admin-only (ADMIN_EMAILS allowlist). Grants or revokes a seller's verified
// badge: { verified: true }  -> seller_verified=true,  verification_status='verified'
//        { verified: false } -> seller_verified=false, verification_status='unverified'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    const adminUser = await getAdminUserFromToken(token)
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    if (typeof body?.verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Body must include { verified: boolean }.' },
        { status: 400 }
      )
    }
    const verified: boolean = body.verified

    const admin = getSupabaseAdmin()

    const { data: seller, error: fetchError } = await admin
      .from('user_profiles')
      .select('id, is_seller')
      .eq('id', params.id)
      .single()

    if (fetchError || !seller) {
      return NextResponse.json({ error: 'Seller not found.' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await admin
      .from('user_profiles')
      .update({
        seller_verified: verified,
        verification_status: verified ? 'verified' : 'unverified',
      })
      .eq('id', params.id)
      .select('id, seller_verified, verification_status')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ seller: updated })
  } catch (error) {
    console.error('Admin verify seller error:', error)
    return NextResponse.json(
      { error: 'Failed to update verification.' },
      { status: 500 }
    )
  }
}
