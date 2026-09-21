import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/reports
// Authorization: Bearer <supabase access token>
// Body (listing report): { product_id, reason, details? }
// Body (user report):    { reported_user_id, reason, details?, message_id?, conversation_id? }
// Exactly one of product_id / reported_user_id is required.
// Any signed-in user may report an active listing that is not their own, or
// another user (not themselves). One open report per reporter per target
// (409 on duplicate). Max 10 reports per user per day (429 over the limit).
const ALLOWED_REASONS = [
  'Prohibited or dangerous item',
  'Counterfeit or recalled item',
  'Wrong category or misleading',
  'Spam or scam',
  'Inappropriate content',
  'Harassment or abusive behavior',
  'Suspicious or scam account',
  'Other',
]

const MAX_REPORTS_PER_DAY = 10

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to submit a report.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Please sign in to submit a report.' }, { status: 401 })
    }
    const reporter = userData.user

    // R6: basic anti-flood — 10 reports per user per day.
    if (!rateLimit(`reports:${reporter.id}`, MAX_REPORTS_PER_DAY, 24 * 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many reports submitted. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    const productId = typeof body?.product_id === 'string' ? body.product_id : null
    const reportedUserId = typeof body?.reported_user_id === 'string' ? body.reported_user_id : null
    const messageId = typeof body?.message_id === 'string' ? body.message_id : null
    const conversationId = typeof body?.conversation_id === 'string' ? body.conversation_id : null
    const reason = body?.reason
    const details = typeof body?.details === 'string' ? body.details.trim() : null

    // Exactly one report target.
    if ((productId ? 1 : 0) + (reportedUserId ? 1 : 0) !== 1) {
      return NextResponse.json(
        { error: 'Provide exactly one of product_id or reported_user_id.' },
        { status: 400 }
      )
    }
    if (!reason || !ALLOWED_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Please choose a valid reason.' }, { status: 400 })
    }

    let sellerId: string | null = null

    if (productId) {
      // Verify the product exists and is active.
      const { data: product, error: productError } = await admin
        .from('products')
        .select('id, seller_id, is_active')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
      }
      if (!product.is_active) {
        return NextResponse.json({ error: 'This listing is no longer active.' }, { status: 400 })
      }
      if (product.seller_id === reporter.id) {
        return NextResponse.json({ error: 'You cannot report your own listing.' }, { status: 400 })
      }
      sellerId = product.seller_id
    } else {
      // User report: the target must exist and not be the reporter.
      if (reportedUserId === reporter.id) {
        return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 })
      }
      const { data: targetUser, error: targetError } =
        await admin.auth.admin.getUserById(reportedUserId!)
      if (targetError || !targetUser?.user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 })
      }
    }

    // Dedupe: one open report per reporter per target.
    let dedupeQuery = admin
      .from('reports')
      .select('id')
      .eq('reporter_id', reporter.id)
      .eq('status', 'open')
    dedupeQuery = productId
      ? dedupeQuery.eq('product_id', productId)
      : dedupeQuery.eq('reported_user_id', reportedUserId)

    const { data: existing, error: existingError } = await dedupeQuery.maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this. Our team is reviewing it.' },
        { status: 409 }
      )
    }

    const { data: report, error: insertError } = await admin
      .from('reports')
      .insert({
        reporter_id: reporter.id,
        product_id: productId,
        reported_user_id: reportedUserId,
        message_id: messageId,
        conversation_id: conversationId,
        reason,
        details: details || null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: report.id }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 })
  }
}
