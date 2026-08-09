import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getUserFromRequest } from '../auth'

export const dynamic = 'force-dynamic'

// GET /api/messages/unread-count
// Authorization: Bearer <supabase access token>
// Lightweight total of unread messages across all of the user's threads —
// used by the navbar badge so it can poll cheaply.

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: conversations, error: convoError } = await admin
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

    if (convoError) throw convoError

    const ids = (conversations || []).map((c: any) => c.id)
    if (ids.length === 0) {
      return NextResponse.json({ unread: 0 })
    }

    const { count, error: countError } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .neq('sender_id', user.id)
      .is('read_at', null)

    if (countError) throw countError

    return NextResponse.json({ unread: count || 0 })
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ error: 'Failed to load unread count.' }, { status: 500 })
  }
}
