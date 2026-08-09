'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Message } from '@/lib/types'
import ListingImage from '@/components/shop/ListingImage'

type ThreadInfo = {
  id: string
  role: 'buyer' | 'seller'
  viewer_id: string
  product: { id: string; title: string; price: number; image: string | null } | null
  other_party: { id?: string; name: string }
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [thread, setThread] = useState<ThreadInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push(`/auth/login?redirect=${encodeURIComponent(`/messages/${conversationId}`)}`)
          return
        }

        // GET also marks the other party's messages as read.
        const res = await fetch(`/api/messages/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to load conversation.')

        if (!cancelled) {
          setThread(data.conversation)
          setMessages(data.messages || [])
          setError('')
          if ((data.messages?.length || 0) !== lastCountRef.current) {
            lastCountRef.current = data.messages?.length || 0
            setTimeout(scrollToBottom, 50)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load conversation.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    // No realtime infra in this project — poll the thread every few seconds.
    const interval = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return

    setSending(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login?redirect=${encodeURIComponent(`/messages/${conversationId}`)}`)
        return
      }

      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to send message.')

      setMessages((prev) => [...prev, data.message])
      lastCountRef.current += 1
      setDraft('')
      setTimeout(scrollToBottom, 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-taupe mb-4">{error || 'Conversation not found'}</p>
        <Link href="/messages" className="btn btn-primary px-6 py-2">
          Back to Messages
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/messages" className="text-taupe hover:text-gold transition-colors" aria-label="Back to messages">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-cormorant text-2xl font-bold text-charcoal">{thread.other_party.name}</h1>
          <p className="text-xs text-taupe uppercase tracking-wider">
            {thread.role === 'buyer' ? 'Seller' : 'Buyer'}
          </p>
        </div>
      </div>

      {/* Listing context card */}
      {thread.product && (
        <Link
          href={`/shop/products/${thread.product.id}`}
          className="card flex items-center gap-4 mb-6 !py-3 hover:border-gold transition-colors"
        >
          <div className="w-14 h-14 rounded-xl bg-ivory border border-blush overflow-hidden flex-shrink-0">
            {thread.product.image ? (
              <ListingImage
                src={thread.product.image}
                alt={thread.product.title}
                className="w-full h-full"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal truncate">{thread.product.title}</p>
            <p className="text-sm text-gold font-bold">${thread.product.price.toFixed(2)}</p>
          </div>
          <span className="text-xs text-taupe flex-shrink-0">View listing →</span>
        </Link>
      )}

      {/* Messages */}
      <div className="card flex-1 mb-4 overflow-y-auto max-h-[55vh] !p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-taupe text-sm py-8">
            No messages yet — say hello to {thread.other_party.name}!
          </p>
        ) : (
          messages.map((m) => {
            const own = m.sender_id === thread.viewer_id
            return (
              <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    own
                      ? 'bg-charcoal text-cream rounded-br-sm'
                      : 'bg-ivory border border-blush text-charcoal rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${own ? 'text-cream/60' : 'text-taupe'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {own && m.read_at && ' · Read'}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {/* Composer */}
      <form onSubmit={handleSend} className="flex gap-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={`Message ${thread.other_party.name}...`}
          className="input flex-1 resize-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn btn-primary px-5 py-3 flex items-center gap-2"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </form>
    </div>
  )
}
