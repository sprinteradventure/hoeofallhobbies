import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getAdminUserFromToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /api/admin/reports/[id]/action
// Authorization: Bearer <supabase access token>
// Admin-only (ADMIN_EMAILS allowlist).
// Body: { action, admin_note? }
// Actions:
//   deactivate_listing / reactivate_listing — flip products.is_active, resolve
//   delete_listing                          — delete the product row, resolve
//   ban_seller    — ban seller via auth admin + deactivate all their listings
//   unban_seller  — lift the ban (does NOT reactivate listings)
//   resolve / dismiss — just update report status (+ admin_note, resolved_at)
const ACTIONS = [
  'deactivate_listing',
  'reactivate_listing',
  'delete_listing',
  'ban_seller',
  'unban_seller',
  'resolve',
  'dismiss',
] as const

type ModerationAction = (typeof ACTIONS)[number]

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

    const body = await request.json().catch(() => null)
    const action = body?.action as ModerationAction
    const adminNote = typeof body?.admin_note === 'string' ? body.admin_note.trim() : null

    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Load the report (service role bypasses RLS).
    const { data: report, error: reportError } = await admin
      .from('reports')
      .select('*')
      .eq('id', params.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    if (report.status !== 'open') {
      return NextResponse.json(
        { error: `This report is already ${report.status}.` },
        { status: 409 }
      )
    }

    const productId: string | null = report.product_id

    // Listing-scoped actions require the product to still exist.
    let sellerId: string | null = null
    if (['deactivate_listing', 'reactivate_listing', 'delete_listing', 'ban_seller'].includes(action)) {
      if (!productId) {
        return NextResponse.json(
          { error: 'This report has no listing attached.' },
          { status: 400 }
        )
      }
      const { data: product, error: productError } = await admin
        .from('products')
        .select('id, seller_id')
        .eq('id', productId)
        .single()
      if (productError || !product) {
        return NextResponse.json(
          { error: 'The listing no longer exists.' },
          { status: 404 }
        )
      }
      sellerId = product.seller_id
    } else if (action === 'unban_seller') {
      // Resolve the seller from the listing if it still exists, else the
      // reported user. Listing lookup is best-effort (product may be deleted).
      if (productId) {
        const { data: product } = await admin
          .from('products')
          .select('seller_id')
          .eq('id', productId)
          .maybeSingle()
        sellerId = product?.seller_id ?? null
      }
      if (!sellerId) sellerId = report.reported_user_id
      if (!sellerId) {
        return NextResponse.json(
          { error: 'No seller found for this report.' },
          { status: 400 }
        )
      }
    }

    // Apply the moderation effect.
    switch (action) {
      case 'deactivate_listing': {
        const { error } = await admin
          .from('products')
          .update({ is_active: false })
          .eq('id', productId)
        if (error) throw error
        break
      }
      case 'reactivate_listing': {
        const { error } = await admin
          .from('products')
          .update({ is_active: true })
          .eq('id', productId)
        if (error) throw error
        break
      }
      case 'delete_listing': {
        // Mark the report resolved BEFORE deleting the product: reports
        // .product_id has ON DELETE CASCADE, so deleting the product first
        // would remove this report row as well.
        const { data: resolvedReport, error: resolveError } = await admin
          .from('reports')
          .update({
            status: 'resolved',
            admin_note: adminNote || report.admin_note,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', report.id)
          .select('*')
          .single()
        if (resolveError) throw resolveError

        const { error } = await admin
          .from('products')
          .delete()
          .eq('id', productId)
        if (error) throw error
        return NextResponse.json({ report: resolvedReport, action })
      }
      case 'ban_seller': {
        // ~100 years: effectively permanent until explicitly unbanned.
        const { error: banError } = await admin.auth.admin.updateUserById(
          sellerId!,
          { ban_duration: '876000h' }
        )
        if (banError) throw banError

        const { error: deactivateError } = await admin
          .from('products')
          .update({ is_active: false })
          .eq('seller_id', sellerId!)
        if (deactivateError) throw deactivateError
        break
      }
      case 'unban_seller': {
        const { error: unbanError } = await admin.auth.admin.updateUserById(
          sellerId!,
          { ban_duration: 'none' }
        )
        if (unbanError) throw unbanError
        // Listings are intentionally NOT reactivated.
        break
      }
      case 'resolve':
      case 'dismiss':
        // No side effects; status update below.
        break
    }

    // Update the report itself.
    const { data: updated, error: updateError } = await admin
      .from('reports')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        admin_note: adminNote || report.admin_note,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', report.id)
      .select('*')
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ report: updated, action })
  } catch (error) {
    console.error('Admin report action error:', error)
    return NextResponse.json(
      { error: 'Failed to apply moderation action' },
      { status: 500 }
    )
  }
}
