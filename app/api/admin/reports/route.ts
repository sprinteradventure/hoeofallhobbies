import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/reports?status=open|all
// Authorization: Bearer <supabase access token>
// Admin-only (ADMIN_EMAILS allowlist). Returns reports joined with product
// info, reporter profile (email/username) and seller profile (email/username).
// Profiles are looked up via user_profiles (which carries email + username),
// so no auth.admin.listUsers call is needed.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    const adminUser = await getAdminUserFromToken(token)
    if (!adminUser) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    const statusFilter = request.nextUrl.searchParams.get('status') || 'open'

    let query = admin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter === 'open') {
      query = query.eq('status', 'open')
    } else if (statusFilter !== 'all') {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    const { data: reports, error: reportsError } = await query
    if (reportsError) throw reportsError

    const productIds = [...new Set((reports || []).map((r) => r.product_id).filter(Boolean))] as string[]
    const userIds = [...new Set((reports || []).map((r) => r.reporter_id))]

    // Fetch related products, then collect seller ids too.
    const { data: products, error: productsError } = productIds.length
      ? await admin
          .from('products')
          .select('id, title, price, is_active, seller_id')
          .in('id', productIds)
      : { data: [], error: null }
    if (productsError) throw productsError

    const sellerIds = [...new Set((products || []).map((p) => p.seller_id))]
    const allUserIds = [...new Set([...userIds, ...sellerIds])]

    const { data: profiles, error: profilesError } = allUserIds.length
      ? await admin
          .from('user_profiles')
          .select('id, email, username')
          .in('id', allUserIds)
      : { data: [], error: null }
    if (profilesError) throw profilesError

    const productById = new Map((products || []).map((p) => [p.id, p]))
    const profileById = new Map((profiles || []).map((p) => [p.id, p]))

    const enriched = (reports || []).map((report) => {
      const product = report.product_id ? productById.get(report.product_id) : null
      const reporter = profileById.get(report.reporter_id)
      const seller = product ? profileById.get(product.seller_id) : null

      return {
        ...report,
        product: product
          ? {
              id: product.id,
              title: product.title,
              price: product.price,
              is_active: product.is_active,
              seller_id: product.seller_id,
            }
          : null,
        reporter: reporter
          ? { id: reporter.id, email: reporter.email, username: reporter.username }
          : { id: report.reporter_id, email: null, username: null },
        seller: seller
          ? { id: seller.id, email: seller.email, username: seller.username }
          : null,
      }
    })

    return NextResponse.json({ reports: enriched })
  } catch (error) {
    console.error('Admin reports error:', error)
    return NextResponse.json(
      { error: 'Failed to load reports' },
      { status: 500 }
    )
  }
}
