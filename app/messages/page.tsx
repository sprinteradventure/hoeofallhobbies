'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ConversationSummary } from '@/lib/types'

// Inbox — serves buyers and sellers from the same account system. Each row
// is one listing thread; the badge shows messages the other party sent that
// you haven't opened yet.
export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push(`/auth/login?redirect=${encodeURIComponent('/messages')}`)
          return
        }

        const res = await fetch('/api/messages/conversations', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to load messages.')
        if (!cancelled) {
          setConversations(data.conversations || [])
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    // No realtime infra in this project — light polling keeps the list fresh.
    const interval = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function formatTime(iso: string) {
    const date = new Date(iso)
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    return sameDay
      ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Messages</h1>
      <p className="text-taupe font-lora mb-8">Conversations with buyers and sellers about listings</p>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-taupe" />
          </div>
          <p className="text-charcoal font-semibold mb-2">No messages yet</p>
          <p className="text-taupe text-sm mb-6">
            Use &ldquo;Message Seller&rdquo; on any listing to start a conversation
          </p>
          <Link href="/shop/products" className="btn btn-primary px-6 py-2.5">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="card flex items-center gap-4 hover:border-gold transition-colors !py-4"
            >
              <div className="w-16 h-16 rounded-xl bg-ivory border border-blush overflow-hidden flex-shrink-0">
                {c.product?.image ? (
                  <img src={c.product.image} alt={c.product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-charcoal truncate">{c.other_party.name}</p>
                  <span className="badge badge-blush flex-shrink-0">
                    {c.role === 'buyer' ? 'Seller' : 'Buyer'}
                  </span>
                </div>
                <p className="text-xs text-gold font-semibold uppercase tracking-wider truncate">
                  {c.product?.title || 'Listing removed'}
                </p>
                <p className="text-sm text-taupe truncate mt-1">
                  {c.last_message
                    ? `${c.last_message.sender_id !== c.other_party.id ? 'You: ' : ''}${c.last_message.body}`
                    : 'No messages yet — say hello!'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {c.last_message && (
                  <span className="text-xs text-taupe">{formatTime(c.last_message.created_at)}</span>
                )}
                {c.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-gold text-white text-xs font-bold">
                    {c.unread_count > 99 ? '99+' : c.unread_count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
