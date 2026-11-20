'use client'

import { useEffect, useState } from 'react'
import { Share2, Copy, Check, Instagram, Facebook, Globe, Pin, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Client interactivity for the public storefront: copy-link + share sheet +
// the shop's own social links + follow toggle. Kept separate so /shops/[slug]
// stays a server component for SEO.

export default function StorefrontClient({
  shareUrl,
  shopName,
  sellerId,
  instagramUrl,
  pinterestUrl,
  facebookUrl,
  websiteUrl,
}: {
  shareUrl: string
  shopName: string
  sellerId: string
  instagramUrl?: string | null
  pinterestUrl?: string | null
  facebookUrl?: string | null
  websiteUrl?: string | null
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [follow, setFollow] = useState<{ count: number; following: boolean; unavailable: boolean }>({
    count: 0,
    following: false,
    unavailable: false,
  })
  const [followBusy, setFollowBusy] = useState(false)

  const slug = shareUrl.split('/shops/')[1] || ''

  useEffect(() => {
    let cancelled = false
    async function loadFollow() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`/api/shops/${slug}/follow`, {
          ...(session
            ? { headers: { Authorization: `Bearer ${session.access_token}` } }
            : {}),
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setFollow({ count: data.count || 0, following: !!data.following, unavailable: !!data.unavailable })
      } catch {
        // follow unavailable — hide quietly
      }
    }
    loadFollow()
    return () => { cancelled = true }
  }, [slug])

  async function toggleFollow() {
    if (followBusy) return
    setFollowBusy(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      const res = await fetch(`/api/shops/${slug}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ seller_id: sellerId }),
      })
      if (res.status === 401) {
        router.push('/auth/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setFollow({ count: data.count || 0, following: !!data.following, unavailable: false })
      }
    } catch {
      // non-fatal
    } finally {
      setFollowBusy(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can be unavailable (insecure context) — fall back.
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareText = `Shop ${shopName} on Hoe of All Hobbies`
  const socials = [
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: pinterestUrl, icon: Pin, label: 'Pinterest' },
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: websiteUrl, icon: Globe, label: 'Website' },
  ].filter((s) => !!s.url)

  const shareTargets = [
    {
      label: 'Pinterest',
      href: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!follow.unavailable && (
        <button
          onClick={toggleFollow}
          disabled={followBusy}
          aria-pressed={follow.following}
          className={`btn px-5 py-2.5 text-sm ${
            follow.following
              ? 'bg-gold/10 text-gold border border-gold hover:bg-gold hover:text-white'
              : 'btn-primary'
          }`}
        >
          <Heart className={`h-4 w-4 mr-1.5 ${follow.following ? 'fill-current' : ''}`} />
          {follow.following ? 'Following' : 'Follow'}
          {follow.count > 0 && <span className="ml-1.5 text-xs opacity-80">{follow.count}</span>}
        </button>
      )}
      <button
        onClick={copyLink}
        className="btn btn-primary px-5 py-2.5 text-sm"
        aria-live="polite"
      >
        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
        {copied ? 'Link copied!' : 'Copy shop link'}
      </button>

      <div className="relative group">
        <button className="btn btn-secondary px-4 py-2.5 text-sm" aria-label="Share shop">
          <Share2 className="h-4 w-4" />
        </button>
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 border border-blush z-10">
          {shareTargets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora text-sm"
            >
              Share on {t.label}
            </a>
          ))}
        </div>
      </div>

      {socials.map(({ url, icon: Icon, label }) => (
        <a
          key={label}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="w-10 h-10 rounded-full border border-blush flex items-center justify-center text-taupe hover:text-gold hover:border-gold transition-colors"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}
