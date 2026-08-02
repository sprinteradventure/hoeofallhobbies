'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CATEGORIES, getSubcategoriesForCategory, isCollectiblesCategory, COLLECTIBLES_CATEGORY_NAME } from '@/lib/categories'
import ImageUploader from '@/components/ImageUploader'
import VideoUploader from '@/components/VideoUploader'
import { Wallet, AlertTriangle, ExternalLink, Plus, Sparkles } from 'lucide-react'

const CONDITIONS = ['new', 'like-new', 'used', 'damaged']

type PayoutStatus = {
  hasAccount: boolean
  onboardingComplete: boolean
  payoutsEnabled: boolean
}

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  // ── Payout status check ───────────────────────────────────────────────────
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null)
  const [checkingPayouts, setCheckingPayouts] = useState(true)

  // ── Collectibles custom subcategories ─────────────────────────────────────
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([])
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('')
  const [addingSubcategory, setAddingSubcategory] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: CONDITIONS[0],
    quantity: '1',
    tags: '',
    weight_oz: '',
    length_in: '',
    width_in: '',
    height_in: '',
  })

  // Check payout status on mount
  useEffect(() => {
    async function checkPayoutStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        const res = await fetch('/api/connect/onboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok) {
          setPayoutStatus(data)
        }
      } catch (err) {
        console.error('Failed to check payout status:', err)
      } finally {
        setCheckingPayouts(false)
      }
    }

    checkPayoutStatus()
  }, [router])

  // Load custom subcategories when Collectibles is selected
  useEffect(() => {
    if (selectedCategories.includes(COLLECTIBLES_CATEGORY_NAME)) {
      loadCustomSubcategories()
    }
  }, [selectedCategories])

  async function loadCustomSubcategories() {
    try {
      const res = await fetch('/api/categories/custom-subcategories')
      const data = await res.json()
      if (res.ok && data.subcategories) {
        setCustomSubcategories(data.subcategories)
      }
    } catch (err) {
      console.error('Failed to load custom subcategories:', err)
    }
  }

  async function addCustomSubcategory() {
    const name = newSubcategoryInput.trim()
    if (!name) return

    setAddingSubcategory(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in to create a subcategory.')
        return
      }

      const res = await fetch('/api/categories/custom-subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create subcategory.')
        return
      }

      // Add to local list and select it
      setCustomSubcategories((prev) => {
        const updated = [...prev, data.name].sort()
        return updated
      })
      setSelectedSubcategories((prev) => [...prev, data.name])
      setNewSubcategoryInput('')
    } catch (err) {
      setError('Failed to create subcategory. Please try again.')
    } finally {
      setAddingSubcategory(false)
    }
  }

  const payoutsReady = payoutStatus?.payoutsEnabled === true

  function toggleCategory(name: string) {
    setSelectedCategories((prev) => {
      if (prev.includes(name)) {
        const removedSubs = new Set(getSubcategoriesForCategory(name))
        // Also remove any custom subcategories if leaving Collectibles
        if (isCollectiblesCategory(name)) {
          customSubcategories.forEach((sub) => removedSubs.add(sub))
        }
        setSelectedSubcategories((subs) => subs.filter((s) => !removedSubs.has(s)))
        return prev.filter((c) => c !== name)
      }
      return [...prev, name]
    })
  }

  function toggleSubcategory(name: string) {
    setSelectedSubcategories((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!payoutsReady) {
        throw new Error(
          'You must complete your payout setup before listing items. ' +
          'Go to Seller Console → Payouts to connect your bank account.'
        )
      }

      if (selectedCategories.length === 0) {
        throw new Error('Please choose at least one category.')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: selectedCategories[0],
          subcategory: selectedSubcategories[0] || null,
          categories: selectedCategories,
          subcategories: selectedSubcategories,
          price: parseFloat(formData.price),
          condition: formData.condition,
          quantity: parseInt(formData.quantity),
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          weight_oz: parseFloat(formData.weight_oz),
          length_in: formData.length_in ? parseFloat(formData.length_in) : null,
          width_in: formData.width_in ? parseFloat(formData.width_in) : null,
          height_in: formData.height_in ? parseFloat(formData.height_in) : null,
          is_active: true,
          images: imageUrls.length > 0 ? imageUrls : [],
          video_url: videoUrl,
        })

      if (insertError) throw insertError
      router.push('/seller/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const hasCollectibles = selectedCategories.includes(COLLECTIBLES_CATEGORY_NAME)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Create New Listing</h1>
        <p className="text-taupe font-lora">List your craft and hobby supplies. You keep 95% of every sale.</p>
      </div>

      {/* Payout warning */}
      {!checkingPayouts && !payoutsReady && (
        <div className="mb-8 rounded-xl border-2 border-yellow-400 bg-yellow-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-cormorant text-xl font-bold text-yellow-900 mb-2">
                Payout Setup Required Before Listing
              </h3>
              <p className="text-sm text-yellow-800 mb-1 leading-relaxed">
                <strong>You cannot publish listings until you set up your payouts.</strong>
                {' '}Buyers won't be able to purchase your items if your bank account isn't connected.
              </p>
              <p className="text-sm text-yellow-700 mb-4 leading-relaxed">
                Go to your <strong>Seller Console → Payouts</strong> and complete the Stripe onboarding
                to connect your bank account. It takes about 2 minutes.
              </p>
              <Link
                href="/seller/payouts"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                <Wallet className="h-4 w-4" />
                Go to Seller Console — Set Up Payouts
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-8">
        {/* Images */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Product Images</h2>
          <ImageUploader value={imageUrls} onChange={setImageUrls} />
        </div>

        {/* Video */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Product Video <span className="text-taupe text-sm font-normal">(optional)</span></h2>
          <VideoUploader value={videoUrl} onChange={setVideoUrl} />
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Basic Information</h2>

          <div>
            <label className="label block mb-2">Product Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What are you selling?"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label block mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item in detail — materials, size, condition, why you're selling..."
              rows={6}
              className="input resize-none"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Category & Details</h2>

          <div>
            <label className="label block mb-2">Categories * <span className="text-taupe font-normal">(pick one or more)</span></label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const selected = selectedCategories.includes(cat.name)
                return (
                  <button
                    type="button"
                    key={cat.slug}
                    onClick={() => toggleCategory(cat.name)}
                    className={`px-3.5 py-2 rounded-full text-sm border-2 transition-all ${
                      selected
                        ? 'border-gold bg-gold/10 text-charcoal font-semibold'
                        : 'border-blush bg-white text-taupe hover:border-gold/50 hover:text-charcoal'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-xs text-taupe mt-2">Choose at least one category so buyers can find your listing.</p>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="space-y-3">
              <label className="label block">Subcategories <span className="text-taupe font-normal">(optional, pick any that fit)</span></label>
              {selectedCategories.map(catName => {
                const baseSubs = getSubcategoriesForCategory(catName)
                const extraSubs = isCollectiblesCategory(catName) ? customSubcategories : []
                const allSubs = [...new Set([...baseSubs, ...extraSubs])]

                if (allSubs.length === 0) return null

                return (
                  <div key={catName} className="rounded-xl border border-blush bg-ivory/50 p-3">
                    <p className="text-xs font-semibold text-taupe uppercase tracking-wide mb-2">{catName}</p>
                    <div className="flex flex-wrap gap-2">
                      {allSubs.map(sub => {
                        const selected = selectedSubcategories.includes(sub)
                        const isCustom = isCollectiblesCategory(catName) && customSubcategories.includes(sub) && !baseSubs.includes(sub)
                        return (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => toggleSubcategory(sub)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                              selected
                                ? 'border-gold bg-gold/10 text-charcoal font-semibold'
                                : 'border-blush bg-white text-taupe hover:border-gold/50 hover:text-charcoal'
                            }`}
                          >
                            {sub}
                            {isCustom && <Sparkles className="inline h-3 w-3 ml-1 text-gold" />}
                          </button>
                        )
                      })}
                    </div>

                    {/* ── Custom subcategory creator (only for Collectibles) ── */}
                    {isCollectiblesCategory(catName) && (
                      <div className="mt-3 pt-3 border-t border-blush/50">
                        <p className="text-xs text-taupe mb-2">
                          Don't see your type of collectible? Create a new subcategory — it will be available to all sellers.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubcategoryInput}
                            onChange={(e) => setNewSubcategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addCustomSubcategory()
                              }
                            }}
                            placeholder="e.g. Pokémon Cards, Funko Pops, Hot Wheels..."
                            className="input flex-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={addCustomSubcategory}
                            disabled={addingSubcategory || !newSubcategoryInput.trim()}
                            className="btn btn-primary px-4 py-2 text-sm whitespace-nowrap"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {addingSubcategory ? 'Adding...' : 'Add Type'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="input"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label block mb-2">Quantity Available *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label block mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="handmade, organic, vintage, wool, etc."
              className="input"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Pricing</h2>

          <div>
            <label className="label block mb-2">Price (USD) *</label>
            <div className="flex">
              <span className="input rounded-r-none w-auto shrink-0 flex items-center px-4 bg-ivory text-taupe border-r-0">$</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input rounded-l-none flex-1"
                required
              />
            </div>
            <p className="text-xs text-taupe mt-2">
              You keep <span className="font-semibold text-gold">95%</span>. Platform fee is only 5%.
            </p>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Shipping</h2>

          <div>
            <label className="label block mb-2">Weight (oz) *</label>
            <input
              type="number"
              name="weight_oz"
              value={formData.weight_oz}
              onChange={handleChange}
              placeholder="e.g. 8"
              step="0.1"
              min="0.1"
              className="input"
              required
            />
            <p className="text-xs text-taupe mt-2">
              Packed weight of one unit. Used to calculate real carrier rates for buyers at checkout.
            </p>
          </div>

          <div>
            <label className="label block mb-2">Package Dimensions (inches, optional)</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                name="length_in"
                value={formData.length_in}
                onChange={handleChange}
                placeholder="Length"
                step="0.1"
                min="0"
                className="input"
              />
              <input
                type="number"
                name="width_in"
                value={formData.width_in}
                onChange={handleChange}
                placeholder="Width"
                step="0.1"
                min="0"
                className="input"
              />
              <input
                type="number"
                name="height_in"
                value={formData.height_in}
                onChange={handleChange}
                placeholder="Height"
                step="0.1"
                min="0"
                className="input"
              />
            </div>
            <p className="text-xs text-taupe mt-2">
              Leave blank to use your default parcel from
              <Link href="/seller/shipping" className="text-gold hover:underline ml-1">Shipping Settings</Link>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-blush">
          <button
            type="submit"
            disabled={loading || checkingPayouts || !payoutsReady}
            className={`btn flex-1 py-3 ${
              !payoutsReady && !checkingPayouts
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                : 'btn btn-primary'
            }`}
          >
            {checkingPayouts
              ? 'Checking payout status...'
              : !payoutsReady
                ? 'Complete Payout Setup to Publish'
                : loading
                  ? 'Creating Listing...'
                  : 'Create Listing'}
          </button>
          <Link href="/seller/listings" className="btn btn-secondary flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
