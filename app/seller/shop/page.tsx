'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store, Save, ExternalLink, Megaphone, ImageIcon, Type, Globe2,
  Instagram, Facebook, Pin, MapPin, Loader2, Check, AlertCircle, Star,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Shop } from '@/lib/types'
import ImageUploader from '@/components/ImageUploader'

// ============================================================================
// /seller/shop — shop setup & customization.
//
// First visit creates the seller's shop row (name + slug minimum); after that
// this is the branding editor: banner, avatar, tagline, story, announcement,
// location, and social links. All of it renders on the public storefront at
// /shops/<slug>.
//
// The page tolerates migration 018 not being applied yet: shop fields probe
// gracefully and show a setup notice instead of crashing.
// ============================================================================

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export default function SellerShopPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [slugTaken, setSlugTaken] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState<Shop | null>(null)
  const [shopName, setShopName] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [myListings, setMyListings] = useState<{ id: string; title: string; images: string[] | null }[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])

  useEffect(() => {
    loadShop()
  }, [])

  async function loadShop() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      // Probe: if migration 018 hasn't run, the from('shops') builder throws
      // a relation-does-not-exist error — catch and show the notice.
      let shop: Shop | null = null
      try {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .eq('seller_id', user.id)
          .maybeSingle()
        shop = (data as Shop) || null
      } catch {
        setSchemaMissing(true)
        return
      }

      if (shop) {
        setForm(shop)
        setShopName(shop.name)
        setFeaturedIds(Array.isArray(shop.featured_product_ids) ? shop.featured_product_ids : [])
        if (shop.slug && slugify(shop.name) !== shop.slug) setSlugEdited(true)
      } else {
        // Prefill shop name from the seller display name if one exists.
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('seller_name, username, bio, avatar_url, location')
          .eq('id', user.id)
          .single()
        const fallbackName = profile?.seller_name || profile?.username || ''
        setForm({
          id: '',
          seller_id: user.id,
          slug: slugify(fallbackName) || '',
          name: fallbackName,
          story: profile?.bio || '',
          avatar_url: profile?.avatar_url || '',
          location: profile?.location || '',
        } as Shop)
        setShopName(fallbackName)
      }

      // Active listings power the featured-products picker. Saved separately
      // from the shop row because the column only exists post-migration-019.
      const { data: listings } = await supabase
        .from('products')
        .select('id, title, images')
        .eq('seller_id', user.id)
        .eq('is_active', true)
        .order('listing_date', { ascending: false })
      setMyListings((listings as any[]) || [])
    } finally {
      setLoading(false)
    }
  }

  // Auto-derive the slug from the shop name until the seller edits it by hand.
  useEffect(() => {
    if (!form || slugEdited) return
    setForm((prev) => (prev ? { ...prev, slug: slugify(shopName) } : prev))
  }, [shopName, slugEdited])

  const set = <K extends keyof Shop>(key: K, value: Shop[K]) => {
    setSaved(false)
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const storefrontUrl = useMemo(() => {
    if (typeof window === 'undefined' || !form?.slug) return ''
    return `${window.location.origin}/shops/${form.slug}`
  }, [form?.slug])

  async function checkSlugAvailability(slug: string): Promise<boolean> {
    if (!slug || !userId) return true
    try {
      const { data } = await supabase
        .from('shops')
        .select('seller_id')
        .eq('slug', slug)
        .maybeSingle()
      return !data || (data as any).seller_id === userId
    } catch {
      return true // probe failure shouldn't block saving; the DB UNIQUE will catch it
    }
  }

  async function handleSave() {
    if (!form || !userId || saving) return
    setError('')
    setSlugTaken(false)

    if (!form.name?.trim()) {
      setError('Your shop needs a name.')
      return
    }
    if (!form.slug || !/^[a-z0-9-]{3,40}$/.test(form.slug)) {
      setError('Shop address must be 3–40 characters of lowercase letters, numbers, and dashes.')
      return
    }

    const available = await checkSlugAvailability(form.slug)
    if (!available) {
      setSlugTaken(true)
      setError(`The address "${form.slug}" is taken — try adding your name or specialty.`)
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        seller_id: userId,
        slug: form.slug,
        name: form.name.trim(),
        tagline: form.tagline || null,
        story: form.story || null,
        banner_url: form.banner_url || null,
        avatar_url: form.avatar_url || null,
        announcement: form.announcement || null,
        location: form.location || null,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
        pinterest_url: form.pinterest_url || null,
        facebook_url: form.facebook_url || null,
      }

      const { error: upsertError } = form.id
        ? await supabase.from('shops').update(payload).eq('id', form.id)
        : await supabase.from('shops').insert(payload)

      if (upsertError) throw upsertError

      // Featured listings (migration 019 column). Best-effort: a missing
      // column pre-migration must never fail the whole save.
      if (form.id) {
        const { error: featuredError } = await supabase
          .from('shops')
          .update({ featured_product_ids: featuredIds })
          .eq('id', form.id)
        if (featuredError) {
          console.warn('featured_product_ids not saved (migration 019 applied?):', featuredError.message)
        }
      }

      // Keep the marketplace display name in sync with the shop name so
      // listings and orders show the same brand.
      await supabase
        .from('user_profiles')
        .update({ seller_name: form.name.trim() })
        .eq('id', userId)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      if (String(err?.message || '').includes('duplicate')) {
        setSlugTaken(true)
        setError(`The address "${form.slug}" is taken — try adding your name or specialty.`)
      } else {
        setError('Could not save your shop. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (schemaMissing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h1 className="font-cormorant text-2xl font-bold text-charcoal mb-2">One step left</h1>
              <p className="text-sm text-yellow-800 font-lora leading-relaxed">
                Shops are almost ready — the database migration that creates them
                (supabase/migrations/018_shops_and_coupons.sql) hasn&apos;t been applied to this
                environment yet. Run it in the Supabase SQL editor, then refresh this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const input = 'input font-lora'
  const label = 'label block mb-1.5'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-bold text-charcoal flex items-center gap-3">
            <Store className="h-8 w-8 text-gold" />
            {form?.id ? 'Your Shop' : 'Set Up Your Shop'}
          </h1>
          <p className="text-taupe font-lora mt-1">
            {form?.id
              ? 'Customize how your storefront looks to buyers.'
              : 'Claim your storefront — it takes two minutes.'}
          </p>
        </div>
        {form?.id && (
          <Link href={`/shops/${form.slug}`} target="_blank" className="btn btn-secondary px-5 py-2.5 text-sm">
            <ExternalLink className="h-4 w-4 mr-1.5" />
            View storefront
          </Link>
        )}
      </div>

      {/* Live address preview */}
      <div className="card bg-ivory mb-8">
        <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1.5 flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5" /> Your shop address
        </p>
        <p className="font-lora text-charcoal break-all">
          {storefrontUrl || 'Pick a shop name to generate your address…'}
        </p>
        <p className="text-xs text-taupe mt-1.5 font-lora">
          This is the link to put in your Instagram bio, newsletters, and anywhere else your people find you.
        </p>
      </div>

      <div className="space-y-8">
        {/* Identity */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-5 flex items-center gap-2">
            <Type className="h-5 w-5 text-gold" /> Identity
          </h2>
          <div className="space-y-5">
            <div>
              <label className={label}>Shop name</label>
              <input
                className={input}
                value={shopName}
                maxLength={60}
                placeholder="e.g. Copperfox Fiber Arts"
                onChange={(e) => {
                  setShopName(e.target.value)
                  set('name', e.target.value)
                }}
              />
            </div>
            <div>
              <label className={label}>Shop address (slug)</label>
              <div className="flex items-center gap-2">
                <span className="text-taupe text-sm font-lora hidden sm:inline">/shops/</span>
                <input
                  className={`${input} font-mono ${slugTaken ? 'border-red-300' : ''}`}
                  value={form?.slug || ''}
                  maxLength={40}
                  onChange={(e) => {
                    setSlugEdited(true)
                    set('slug', slugify(e.target.value))
                  }}
                />
              </div>
              {slugTaken && (
                <p className="text-xs text-red-600 mt-1.5">That address is taken — try another.</p>
              )}
            </div>
            <div>
              <label className={label}>Tagline</label>
              <input
                className={input}
                value={form?.tagline || ''}
                maxLength={90}
                placeholder="One line that tells buyers who you are"
                onChange={(e) => set('tagline', e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-taupe" />
                <input
                  className={`${input} pl-10`}
                  value={form?.location || ''}
                  maxLength={60}
                  placeholder="City, State — or just your region"
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Imagery */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-5 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gold" /> Imagery
          </h2>
          <div className="space-y-6">
            <div>
              <label className={label}>Banner image</label>
              <p className="text-xs text-taupe mb-3 font-lora">
                Wide image across the top of your storefront (about 3:1 ratio looks best).
              </p>
              <ImageUploader
                value={form?.banner_url ? [form.banner_url] : []}
                onChange={(urls) => set('banner_url', urls[0] || null)}
              />
            </div>
            <div>
              <label className={label}>Shop avatar</label>
              <p className="text-xs text-taupe mb-3 font-lora">Shown as a round badge over your banner.</p>
              <ImageUploader
                value={form?.avatar_url ? [form.avatar_url] : []}
                onChange={(urls) => set('avatar_url', urls[0] || null)}
              />
            </div>
          </div>
        </section>

        {/* Story & announcement */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-5 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-gold" /> Story &amp; Announcements
          </h2>
          <div className="space-y-5">
            <div>
              <label className={label}>Your story</label>
              <textarea
                className={`${input} min-h-[120px] resize-y`}
                value={form?.story || ''}
                maxLength={2000}
                placeholder="What do you make? What do you love about it? Makers' stories sell."
                onChange={(e) => set('story', e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Announcement bar (optional)</label>
              <input
                className={input}
                value={form?.announcement || ''}
                maxLength={120}
                placeholder="e.g. Fall collection drops Friday! Use code HELLO10 for 10% off."
                onChange={(e) => set('announcement', e.target.value)}
              />
              <p className="text-xs text-taupe mt-1.5 font-lora">
                A slim banner across your storefront — great for sales, restocks, and shipping notes.
              </p>
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2 flex items-center gap-2">
            <Star className="h-5 w-5 text-gold" /> Featured listings
          </h2>
          <p className="text-xs text-taupe mb-5 font-lora">
            Pick up to 4 listings to show first on your storefront with a ★ Featured badge.
          </p>
          {myListings.length === 0 ? (
            <p className="text-sm text-taupe font-lora">
              No active listings yet —{' '}
              <Link href="/seller/listings/new" className="text-gold hover:underline">
                list your first item
              </Link>{' '}
              and feature it here.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {myListings.map((listing) => {
                const checked = featuredIds.includes(listing.id)
                return (
                  <label
                    key={listing.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      checked ? 'border-gold bg-ivory' : 'border-blush hover:border-gold/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSaved(false)
                        setFeaturedIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== listing.id)
                            : prev.length >= 4
                              ? prev
                              : [...prev, listing.id]
                        )
                      }}
                      className="accent-[#c9a876] flex-shrink-0"
                    />
                    {listing.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0]} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-blush/50 flex-shrink-0" />
                    )}
                    <span className="text-sm text-charcoal font-lora truncate">{listing.title}</span>
                  </label>
                )
              })}
            </div>
          )}
        </section>

        {/* Social links */}
        <section className="card">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2">Social &amp; Web</h2>
          <p className="text-xs text-taupe mb-5 font-lora">
            Icons appear on your storefront so buyers can follow your work everywhere.
          </p>
          <div className="space-y-4">
            {([
              ['instagram_url', Instagram, 'https://instagram.com/yourhandle', 'Instagram'],
              ['pinterest_url', Pin, 'https://pinterest.com/yourhandle', 'Pinterest'],
              ['facebook_url', Facebook, 'https://facebook.com/yourpage', 'Facebook'],
              ['website_url', Globe2, 'https://yourwebsite.com', 'Your website'],
            ] as const).map(([key, Icon, placeholder, name]) => (
              <div key={key}>
                <label className={label}>{name}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-taupe" />
                  <input
                    className={`${input} pl-10`}
                    value={(form?.[key] as string) || ''}
                    placeholder={placeholder}
                    onChange={(e) => set(key, e.target.value as never)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 mt-8">
        <div className="card !py-4 flex flex-wrap items-center gap-4 shadow-lg border-gold/30">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary px-8 py-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {form?.id ? 'Save changes' : 'Create my shop'}
          </button>
          {saved && (
            <span className="text-green-700 text-sm font-lora flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Saved — your storefront is live.
            </span>
          )}
          {error && <span className="text-red-700 text-sm font-lora">{error}</span>}
          <Link href="/seller/dashboard" className="ml-auto text-sm text-taupe hover:text-gold font-lora">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
