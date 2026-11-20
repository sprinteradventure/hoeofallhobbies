'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Megaphone, BadgePercent, Pin, Copy, Check, ExternalLink, Plus,
  Trash2, Loader2, AlertCircle, Store, Share2, Gift, Newspaper,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Shop, SellerCoupon, Product } from '@/lib/types'

// ============================================================================
// /seller/marketing — the seller's marketing hub.
//
// Three tools in one place:
//   1. Shopfront — copy/share the storefront link (with per-listing links).
//   2. Coupons — create and manage shop discount codes (migration 018).
//   3. Pinterest — every listing has a ready-made branded pin image to save.
//
// Graceful degradation: if migration 018 hasn't been applied, coupon and shop
// sections show setup notices instead of erroring.
// ============================================================================

export default function MarketingPage() {
  const [loading, setLoading] = useState(true)
  const [schemaMissing, setSchemaMissing] = useState<'shops' | 'coupons' | null>(null)

  const [shop, setShop] = useState<Shop | null>(null)
  const [listings, setListings] = useState<Product[]>([])
  const [coupons, setCoupons] = useState<SellerCoupon[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  // Shop updates (migration 019) + followers
  const [posts, setPosts] = useState<any[]>([])
  const [followers, setFollowers] = useState<number | null>(null)
  const [postBody, setPostBody] = useState('')
  const [postProductId, setPostProductId] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  // Coupon form
  const [code, setCode] = useState('')
  const [percentOff, setPercentOff] = useState('10')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Shops (tolerate missing migration)
      let shopSlug: string | null = null
      try {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .eq('seller_id', user.id)
          .maybeSingle()
        setShop((data as Shop) || null)
        shopSlug = (data as Shop)?.slug || null
      } catch {
        setSchemaMissing('shops')
      }

      // Coupons (tolerate missing migration)
      try {
        const { data } = await supabase
          .from('seller_coupons')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
        setCoupons((data as SellerCoupon[]) || [])
      } catch {
        setSchemaMissing('coupons')
      }

      // Active listings (pins + share links per listing)
      const { data: products } = await supabase
        .from('products')
        .select('id, title, price, images')
        .eq('seller_id', user.id)
        .eq('is_active', true)
        .order('listing_date', { ascending: false })
      setListings((products as Product[]) || [])

      // Shop posts + follower count (tolerate missing migration 019)
      try {
        const { data: postRows } = await supabase
          .from('shop_posts')
          .select('id, body, product_id, created_at')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setPosts(postRows || [])
      } catch {
        // posts not enabled
      }
      if (shopSlug) {
        try {
          const res = await fetch(`/api/shops/${shopSlug}/follow`)
          if (res.ok) {
            const data = await res.json()
            setFollowers(typeof data.count === 'number' ? data.count : null)
          }
        } catch {
          // non-fatal
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function publishPost(e: React.FormEvent) {
    e.preventDefault()
    if (posting) return
    setPostError('')
    const body = postBody.trim()
    if (!body) return
    if (body.length > 1000) {
      setPostError('Updates are limited to 1000 characters.')
      return
    }
    setPosting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('shop_posts')
        .insert({
          seller_id: user.id,
          body,
          product_id: postProductId || null,
        })
        .select('id, body, product_id, created_at')
        .single()
      if (error) throw error
      setPosts((prev) => [data, ...prev])
      setPostBody('')
      setPostProductId('')
    } catch {
      setPostError('Could not publish the update. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  async function deletePost(postId: string) {
    try {
      await supabase.from('shop_posts').delete().eq('id', postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch {
      // non-fatal
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000)
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setFormError('')

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
    const pct = parseInt(percentOff, 10)

    if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(cleanCode)) {
      setFormError('Code must be 3–20 letters, numbers, or dashes (e.g. FALL10).')
      return
    }
    if (!Number.isFinite(pct) || pct < 1 || pct > 90) {
      setFormError('Discount must be between 1% and 90%.')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('seller_coupons').insert({
        seller_id: user.id,
        code: cleanCode,
        percent_off: pct,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        expires_at: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
      })
      if (error) {
        if (String(error.message).includes('duplicate')) {
          setFormError('You already have a code with that name.')
        } else {
          throw error
        }
        return
      }
      setCode('')
      setPercentOff('10')
      setMaxUses('')
      setExpiresAt('')
      await loadAll()
    } catch {
      setFormError('Could not create the code. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function toggleCoupon(coupon: SellerCoupon) {
    try {
      await supabase
        .from('seller_coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      )
    } catch {
      // non-fatal; list will refresh on next load
    }
  }

  async function deleteCoupon(coupon: SellerCoupon) {
    try {
      await supabase.from('seller_coupons').delete().eq('id', coupon.id)
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
    } catch {
      // non-fatal
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  const shopUrl = typeof window !== 'undefined' && shop
    ? `${window.location.origin}/shops/${shop.slug}`
    : null

  const shareTargets = shopUrl
    ? [
        { label: 'Pinterest', href: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shopUrl)}&description=${encodeURIComponent(`Shop ${shop!.name} on Hoe of All Hobbies`)}` },
        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}` },
        { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shopUrl)}&text=${encodeURIComponent(`Shop ${shop!.name} on Hoe of All Hobbies`)}` },
      ]
    : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-gold" />
          Marketing
        </h1>
        <p className="text-taupe font-lora mt-1">
          Your shop link, discount codes, and Pinterest pins — everything you need to bring your people with you.
        </p>
      </div>

      {/* 1. Shopfront link */}
      <section className="card mb-8">
        <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2 flex items-center gap-2">
          <Store className="h-5 w-5 text-gold" /> Your storefront link
        </h2>
        {schemaMissing === 'shops' ? (
          <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 font-lora">
            Run migration 018 (supabase/migrations/018_shops_and_coupons.sql) to enable storefronts.
          </p>
        ) : !shop ? (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-taupe font-lora flex-1 min-w-[200px]">
              You don&apos;t have a storefront yet — create one to get a shareable link and a branded page.
            </p>
            <Link href="/seller/shop" className="btn btn-primary px-6 py-2.5 text-sm">
              Set up my shop
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <code className="flex-1 min-w-[200px] bg-ivory rounded-lg px-4 py-3 text-sm text-charcoal font-mono break-all">
                {shopUrl}
              </code>
              <button onClick={() => copy(shopUrl!, 'shop')} className="btn btn-primary px-5 py-2.5 text-sm">
                {copied === 'shop' ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied === 'shop' ? 'Copied!' : 'Copy'}
              </button>
              <Link href={`/shops/${shop.slug}`} target="_blank" className="btn btn-secondary px-5 py-2.5 text-sm">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View
              </Link>
            </div>
            {followers !== null && (
              <p className="text-xs text-taupe font-lora mb-3">
                <span className="font-semibold text-charcoal">{followers}</span>{' '}
                {followers === 1 ? 'person follows' : 'people follow'} your shop
                {followers === 0 && ' — share your link to start building your audience here.'}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-taupe font-lora flex items-center gap-1.5 mr-1">
                <Share2 className="h-3.5 w-3.5" /> Share:
              </span>
              {shareTargets.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost border border-blush px-4 py-1.5 text-xs"
                >
                  {t.label}
                </a>
              ))}
            </div>
            <p className="text-xs text-taupe mt-3 font-lora">
              Tip: put this link in your social bios, email signature, and packaging inserts — your followers don&apos;t need to search; they can come straight to you.
            </p>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 2. Coupons */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2 flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-gold" /> Discount codes
          </h2>
          <p className="text-xs text-taupe mb-5 font-lora">
            Codes apply to your listings at checkout. Share them in your announcement bar, socials, or thank-you notes.
          </p>

          {schemaMissing === 'coupons' ? (
            <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 font-lora">
              Run migration 018 to enable seller coupon codes.
            </p>
          ) : (
            <>
              <form onSubmit={createCoupon} className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <input
                    className="input flex-1 font-mono uppercase"
                    placeholder="CODE"
                    value={code}
                    maxLength={20}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                  <div className="relative w-24">
                    <input
                      className="input pr-7 text-right"
                      type="number"
                      min={1}
                      max={90}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                    />
                    <span className="absolute right-3 top-3.5 text-taupe text-sm">%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="number"
                    min={1}
                    placeholder="Max uses (optional)"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                  <input
                    className="input flex-1"
                    type="date"
                    title="Expires (optional)"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <button type="submit" disabled={creating} className="btn btn-primary w-full py-2.5 text-sm">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                  Create code
                </button>
              </form>

              {coupons.length === 0 ? (
                <p className="text-sm text-taupe font-lora text-center py-4">
                  No codes yet — your first one is a great excuse to post on social media.
                </p>
              ) : (
                <div className="space-y-2">
                  {coupons.map((c) => {
                    const exhausted = c.max_uses != null && c.used_count >= c.max_uses
                    const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false
                    const inactive = !c.is_active || exhausted || expired
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                          inactive ? 'border-blush bg-cream/60 opacity-70' : 'border-gold/40 bg-ivory'
                        }`}
                      >
                        <Gift className="h-4 w-4 text-gold flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-charcoal text-sm">{c.code}</p>
                          <p className="text-xs text-taupe font-lora">
                            {c.percent_off}% off
                            {c.max_uses != null && ` · ${c.used_count}/${c.max_uses} used`}
                            {c.expires_at && ` · ends ${new Date(c.expires_at).toLocaleDateString()}`}
                            {exhausted && ' · exhausted'}
                            {expired && ' · expired'}
                            {!c.is_active && !exhausted && !expired && ' · paused'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCoupon(c)}
                          className="text-xs text-gold hover:underline font-lora flex-shrink-0"
                        >
                          {c.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => deleteCoupon(c)}
                          aria-label={`Delete code ${c.code}`}
                          className="text-taupe hover:text-red-600 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* 3. Pinterest pins per listing */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2 flex items-center gap-2">
            <Pin className="h-5 w-5 text-gold" /> Pinterest pins
          </h2>
          <p className="text-xs text-taupe mb-5 font-lora">
            Every listing gets a branded 1000×1500 pin image, generated automatically. Save it to Pinterest to put your work in front of shoppers searching for inspiration.
          </p>

          {listings.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="h-8 w-8 text-blush mx-auto mb-2" />
              <p className="text-sm text-taupe font-lora">
                No active listings yet.{' '}
                <Link href="/seller/listings/new" className="text-gold hover:underline">
                  List your first item
                </Link>{' '}
                and its pin will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {listings.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-blush px-3 py-2.5">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-ivory flex-shrink-0" />
                  )}
                  <p className="flex-1 min-w-0 text-sm text-charcoal font-lora truncate">{p.title}</p>
                  <a
                    href={`/api/pin-image/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline font-lora flex-shrink-0"
                  >
                    Open pin
                  </a>
                  <button
                    onClick={() => copy(`${window.location.origin}/api/pin-image/${p.id}`, `pin-${p.id}`)}
                    aria-label="Copy pin image link"
                    className="text-taupe hover:text-gold transition-colors flex-shrink-0"
                  >
                    {copied === `pin-${p.id}` ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copy(`${window.location.origin}/shop/products/${p.id}`, `link-${p.id}`)}
                    aria-label="Copy listing link"
                    className="text-taupe hover:text-gold transition-colors flex-shrink-0"
                  >
                    {copied === `link-${p.id}` ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon />}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-taupe mt-4 font-lora">
            On Pinterest, create a pin and paste the pin image URL as the image — the branded frame carries your listing title and price.
          </p>
        </section>
      </div>

      {/* Shop updates composer */}
      <section className="card mt-8">
        <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2 flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-gold" /> Shop updates
        </h2>
        <p className="text-xs text-taupe mb-5 font-lora">
          Short posts that appear on your storefront — restocks, works in progress, sale reminders.
          {shopUrl && (
            <>
              {' '}Followers who visit <Link href={`/shops/${shop.slug}`} className="text-gold hover:underline">{shopUrl.replace(/^https?:\/\//, '')}</Link> see them right away.
            </>
          )}
        </p>

        {!shop ? (
          <p className="text-sm text-taupe font-lora">
            Set up your storefront first — updates publish to your shop page.
          </p>
        ) : (
          <>
            <form onSubmit={publishPost} className="mb-6">
              <textarea
                className="input min-h-[90px] resize-y mb-3"
                placeholder="e.g. Fall collection drops Friday! Followers get early access with code FALL10."
                value={postBody}
                maxLength={1000}
                onChange={(e) => setPostBody(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="input !w-auto text-sm"
                  value={postProductId}
                  onChange={(e) => setPostProductId(e.target.value)}
                >
                  <option value="">Link a listing (optional)</option>
                  {listings.map((p) => (
                    <option key={p.id} value={p.id}>{p.title.slice(0, 60)}</option>
                  ))}
                </select>
                <button type="submit" disabled={posting || !postBody.trim()} className="btn btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                  {posting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Megaphone className="h-4 w-4 mr-1.5" />}
                  Publish update
                </button>
              </div>
              {postError && <p className="text-xs text-red-600 mt-2">{postError}</p>}
            </form>

            {posts.length > 0 && (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="flex items-start gap-3 rounded-lg border border-blush px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-charcoal font-lora whitespace-pre-line">{post.body}</p>
                      <p className="text-xs text-taupe mt-1">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {post.product_id && listings.some((p) => p.id === post.product_id) && (
                          <span> · linked: {listings.find((p) => p.id === post.product_id)!.title.slice(0, 40)}</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      aria-label="Delete update"
                      className="text-taupe hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <div className="mt-8 text-right">
        <Link href="/seller/dashboard" className="text-sm text-taupe hover:text-gold font-lora">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

function LinkIcon() {
  return <Share2 className="h-4 w-4" />
}
