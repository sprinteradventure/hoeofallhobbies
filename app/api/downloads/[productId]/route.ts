import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// DIGITAL DOWNLOAD — verified file delivery for digital template purchases.
// ----------------------------------------------------------------------------
// GET /api/downloads/[productId]
// Authorization: Bearer <supabase access token>
//
// The digital-files bucket is PRIVATE: objects can never be fetched via a
// public URL. This route is the only way buyers get the bytes:
//   1. Authenticate the requesting user.
//   2. Confirm the product is a digital listing with a file attached.
//   3. Confirm the user has a PAID order containing this product
//      (order_items → orders; status paid/shipped/delivered/completed).
//   4. Mint a short-lived signed URL (5 min) and redirect to it.
// Anything else → 404 (we deliberately don't distinguish "no such product"
// from "no purchase", so the endpoint can't be used to probe the catalog).
// ============================================================================

const DIGITAL_BUCKET = 'digital-files'
const SIGNED_URL_TTL_SECONDS = 300

const PAID_STATUSES = ['paid', 'shipped', 'delivered', 'completed']

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { error: 'Please sign in to download your purchase.' },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Please sign in to download your purchase.' },
        { status: 401 }
      )
    }
    const user = userData.user

    // Product must exist, be a digital listing, and have a file attached.
    // RLS for buyers reading products is permissive, but we use the service
    // role so this check behaves identically for every order state.
    const { data: product } = await admin
      .from('products')
      .select('id, product_type, digital_file_path')
      .eq('id', params.productId)
      .single()

    if (
      !product ||
      (product as any).product_type !== 'digital' ||
      !(product as any).digital_file_path
    ) {
      return NextResponse.json({ error: 'Download not found.' }, { status: 404 })
    }

    // The buyer must have a PAID order containing this product. service-role
    // query across order_items → orders; the orders_status_guard trigger does
    // not apply to the service role, so reading any status is safe here.
    const { data: purchase } = await admin
      .from('order_items')
      .select('id, order:orders!inner(buyer_id, status)')
      .eq('product_id', params.productId)
      .eq('order.buyer_id', user.id)
      .in('order.status', PAID_STATUSES)
      .limit(1)
      .maybeSingle()

    if (!purchase) {
      return NextResponse.json(
        { error: 'Download not found.' },
        { status: 404 }
      )
    }

    const { data: signed, error: signError } = await admin.storage
      .from(DIGITAL_BUCKET)
      .createSignedUrl((product as any).digital_file_path as string, SIGNED_URL_TTL_SECONDS, {
        download: true,
      })

    if (signError || !signed?.signedUrl) {
      console.error('Digital download sign error:', signError)
      return NextResponse.json(
        { error: 'Could not prepare your download. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(signed.signedUrl)
  } catch (error) {
    console.error('Digital download error:', error)
    return NextResponse.json({ error: 'Download failed.' }, { status: 500 })
  }
}
