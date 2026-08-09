import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getUserFromRequest } from '../auth'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST /api/messages/conversations — create-or-get a listing thread
// Authorization: Bearer <supabase access token>
// Body: { product_id }
// A buyer starts (or re-opens) the single conversation thread for a listing.
// You cannot message yourself about your own listing.
//
// GET /api/messages/conversations — inbox list
// Authorization: Bearer <supabase access token>
// Returns the user's conversations (as buyer and as seller) with the listing
// title/image, the other party's display name, the last message snippet and
// an unread count, ordered by latest activity.
// ============================================================================

const createConversationSchema = z.object({
  product_id: z.string().uuid(),
})

function displayName(profile: any): string {
  return profile?.seller_name || profile?.username || profile?.full_name || 'Unknown'
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to message a seller.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = createConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid product_id.' }, { status: 400 })
    }
    const { product_id } = parsed.data

    const admin = getSupabaseAdmin()

    const { data: product, error: productError } = await admin
      .from('products')
      .select('id, seller_id')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
    }
    if (product.seller_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot message yourself about your own listing.' },
        { status: 400 }
      )
    }

    // One thread per buyer per listing — reuse it if it already exists.
    const { data: existing, error: existingError } = await admin
      .from('conversations')
      .select('id')
      .eq('product_id', product_id)
      .eq('buyer_id', user.id)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      return NextResponse.json({ id: existing.id })
    }

    const { data: conversation, error: insertError } = await admin
      .from('conversations')
      .insert({
        product_id,
        buyer_id: user.id,
        seller_id: product.seller_id,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: conversation.id }, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Failed to start conversation.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to view your messages.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: conversations, error: convoError } = await admin
      .from('conversations')
      .select(
        `id, product_id, buyer_id, seller_id, updated_at,
         product:products(id, title, images),
         buyer:user_profiles!conversations_buyer_id_fkey(id, username, full_name, seller_name),
         seller:user_profiles!conversations_seller_id_fkey(id, username, full_name, seller_name)`
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (convoError) throw convoError

    const convos = conversations || []
    if (convos.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Last message + unread count per thread. One query across all threads,
    // newest first; the first row seen per thread is its latest message.
    const convoIds = convos.map((c: any) => c.id)
    const { data: messages, error: messagesError } = await admin
      .from('messages')
      .select('id, conversation_id, sender_id, body, read_at, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })

    if (messagesError) throw messagesError

    const lastMessageByConvo = new Map<string, any>()
    const unreadByConvo = new Map<string, number>()
    for (const m of messages || []) {
      if (!lastMessageByConvo.has(m.conversation_id)) {
        lastMessageByConvo.set(m.conversation_id, m)
      }
      if (m.sender_id !== user.id && !m.read_at) {
        unreadByConvo.set(m.conversation_id, (unreadByConvo.get(m.conversation_id) || 0) + 1)
      }
    }

    const result = convos.map((c: any) => {
      const isBuyer = c.buyer_id === user.id
      const other = isBuyer ? c.seller : c.buyer
      const last = lastMessageByConvo.get(c.id) || null
      return {
        id: c.id,
        role: isBuyer ? 'buyer' : 'seller',
        updated_at: c.updated_at,
        product: c.product
          ? {
              id: c.product.id,
              title: c.product.title,
              image: Array.isArray(c.product.images) && c.product.images.length > 0 ? c.product.images[0] : null,
            }
          : null,
        other_party: { id: other?.id, name: displayName(other) },
        last_message: last
          ? { body: last.body, sender_id: last.sender_id, created_at: last.created_at }
          : null,
        unread_count: unreadByConvo.get(c.id) || 0,
      }
    })

    return NextResponse.json({ conversations: result })
  } catch (error) {
    console.error('List conversations error:', error)
    return NextResponse.json({ error: 'Failed to load conversations.' }, { status: 500 })
  }
}
