import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getUserFromRequest } from '../../auth'
import { sendNewMessageEmail, buildThreadUrl } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/messages/conversations/[id] — fetch a thread
// Authorization: Bearer <supabase access token> (thread participant only)
// Returns the listing context, the other party's display name and every
// message oldest-first. Viewing a thread marks the other party's messages as
// read (auto mark-as-read on view — no separate /read endpoint needed) and
// re-arms the viewer's new-message email notification.
//
// POST /api/messages/conversations/[id] — send a message
// Authorization: Bearer <supabase access token> (thread participant only)
// Body: { body }
// A DB trigger bumps conversations.updated_at so inbox ordering stays fresh.
// The recipient is emailed at most once per thread until they've read or
// replied (throttle flags from migration 014; email is fire-and-forget via
// lib/email.ts and never blocks or breaks message delivery).
// ============================================================================

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty.').max(2000, 'Message is too long (2000 characters max).'),
})

function displayName(profile: any): string {
  return profile?.seller_name || profile?.username || profile?.full_name || 'Unknown'
}

async function getParticipantConversation(admin: any, conversationId: string, userId: string) {
  const { data, error } = await admin
    .from('conversations')
    .select(
      `id, product_id, buyer_id, seller_id, buyer_notified_at, seller_notified_at,
       product:products(id, title, images, price),
       buyer:user_profiles!conversations_buyer_id_fkey(id, username, full_name, seller_name, email),
       seller:user_profiles!conversations_seller_id_fkey(id, username, full_name, seller_name, email)`
    )
    .eq('id', conversationId)
    .single()

  if (error || !data) return null
  if (data.buyer_id !== userId && data.seller_id !== userId) return null
  return data
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to view this conversation.' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const conversation = await getParticipantConversation(admin, params.id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const { data: messages, error: messagesError } = await admin
      .from('messages')
      .select('id, sender_id, body, read_at, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    // Auto mark-as-read: the viewer has now seen everything the other party
    // sent. Service-role client bypasses RLS; the recipient-only RLS policy
    // guards direct client updates of the same shape.
    await admin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', user.id)
      .is('read_at', null)

    // Reading the thread also re-arms the viewer's new-message email
    // notification (see 014_message_notifications.sql for the throttle rules).
    const viewerFlag = conversation.buyer_id === user.id ? 'buyer_notified_at' : 'seller_notified_at'
    await admin
      .from('conversations')
      .update({ [viewerFlag]: null })
      .eq('id', conversation.id)

    const isBuyer = conversation.buyer_id === user.id
    const other = isBuyer ? (conversation as any).seller : (conversation as any).buyer
    const product = (conversation as any).product

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        role: isBuyer ? 'buyer' : 'seller',
        viewer_id: user.id,
        product: product
          ? {
              id: product.id,
              title: product.title,
              price: product.price,
              image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
            }
          : null,
        other_party: { id: other?.id, name: displayName(other) },
      },
      messages: messages || [],
    })
  } catch (error) {
    console.error('Fetch conversation error:', error)
    return NextResponse.json({ error: 'Failed to load conversation.' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to send a message.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid message.' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const conversation = await getParticipantConversation(admin, params.id, user.id)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const { data: message, error: insertError } = await admin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: parsed.data.body,
      })
      .select('id, sender_id, body, read_at, created_at')
      .single()

    if (insertError) throw insertError

    // --- New-message email notification (throttled, fire-and-forget) --------
    // At most one email per recipient per thread until they've read/replied:
    // clear the sender's own flag (they've clearly seen the thread), then
    // atomically claim the recipient's flag — only the request that flips it
    // from NULL sends the email, so rapid-fire or concurrent sends can't
    // double-notify. See 014_message_notifications.sql.
    const senderIsBuyer = conversation.buyer_id === user.id
    const senderFlag = senderIsBuyer ? 'buyer_notified_at' : 'seller_notified_at'
    const recipientFlag = senderIsBuyer ? 'seller_notified_at' : 'buyer_notified_at'

    const { data: claimed } = await admin
      .from('conversations')
      .update({ [senderFlag]: null, [recipientFlag]: new Date().toISOString() })
      .eq('id', conversation.id)
      .is(recipientFlag, null)
      .select('id')

    if (claimed && claimed.length > 0) {
      const senderProfile = senderIsBuyer ? (conversation as any).buyer : (conversation as any).seller
      const recipientProfile = senderIsBuyer ? (conversation as any).seller : (conversation as any).buyer
      const product = (conversation as any).product
      const bodyText = parsed.data.body
      const recipientId = senderIsBuyer ? conversation.seller_id : conversation.buyer_id

      // Respect the recipient's opt-out (migration 015). The throttle flag
      // above is claimed either way, so re-enabling later doesn't change
      // behavior. Looked up separately from the conversation embed because
      // PostgREST would reject the whole thread query if it selected a column
      // that doesn't exist yet — a failed lookup defaults to ENABLED so the
      // route keeps working (and emailing) before 015 is applied.
      let optedOut = false
      const { data: prefRow, error: prefError } = await admin
        .from('user_profiles')
        .select('message_email_notifications')
        .eq('id', recipientId)
        .single()
      if (!prefError) {
        // NULL/missing means enabled; only an explicit false opts out.
        optedOut = prefRow?.message_email_notifications === false
      }

      if (!optedOut) {
        // Fire-and-forget: never block the 201 on email delivery. Failures are
        // logged inside sendNewMessageEmail; messaging keeps working even when
        // email is misconfigured.
        sendNewMessageEmail({
          to: recipientProfile?.email || '',
          recipientName: displayName(recipientProfile),
          senderName: displayName(senderProfile),
          listingTitle: product?.title || 'your listing',
          snippet: bodyText.length > 140 ? `${bodyText.slice(0, 140)}…` : bodyText,
          threadUrl: buildThreadUrl(conversation.id),
        }).catch((err) => console.error('[email] notification error:', err))
      }
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
