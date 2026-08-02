'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { CATEGORIES, getSubcategoriesForCategory, isCollectiblesCategory, COLLECTIBLES_CATEGORY_NAME } from '@/lib/categories'
import { Wallet, AlertTriangle, ExternalLink, Plus, Sparkles } from 'lucide-react'

const CONDITIONS = ['new', 'like-new', 'used', 'damaged']

type PayoutStatus = {
  hasAccount: boolean
  onboardingComplete: boolean
  payoutsEnabled: boolean
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Payout status check ──────────────────────────────────────────────────
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null)
  const [checkingPayouts, setCheckingPayouts] = useState(true)

  // ── Collectibles custom subcategories ─────────────────────────────────────
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([])
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('')
  const [addingSubcategory, setAddingSubcategory] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0].name,
    subcategory: '',
    price: '',
    condition: CONDITIONS[0],
    quantity: '1',
    tags: '',
    is_active: true,
  })

  // Load product + check payout status
  useEffect(() => {
    async function init() {
      await Promise.all([loadProduct(), checkPayoutStatus()])
    }
    init()
  }, [productId])

  // Load custom subcategories when Collectibles is selected
  useEffect(() => {
    if (isCollectiblesCategory(formData.category)) {
      loadCustomSubcategories()
    }
  }, [formData.category])

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

      setCustomSubcategories((prev) => [...prev, data.name].sort())
      setFormData(prev => ({ ...prev, subcategory: data.name }))
      setNewSubcategoryInput('')
    } catch (err) {
      setError('Failed to create subcategory. Please try again.')
    } finally {
      setAddingSubcategory(false)
    }
  }

  async function loadProduct() {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) throw fetchError

      setFormData({
        title: data.title,
        description: data.description,
        category: data.category || CATEGORIES[0].name,
        subcategory: data.subcategory || '',
        price: data.price.toString(),
        condition: data.condition,
        quantity: data.quantity.toString(),
        tags: (data.tags || []).join(', '),
        is_active: data.is_active,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product')
      router.push('/seller/listings')
    } finally {
      setLoading(false)
    }
  }

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

  const payoutsReady = payoutStatus?.payoutsEnabled === true
  const isCollectibles = isCollectiblesCategory(formData.category)
  const baseSubs = getSubcategoriesForCategory(formData.category)
  const allSubs = isCollectibles ? [...new Set([...baseSubs, ...customSubcategories])] : baseSubs

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!payoutsReady && formData.is_active) {
        throw new Error(
          'You must complete your payout setup before reactivating this listing. ' +
          'Go to Seller Console → Payouts to connect your bank account.'
        )
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || null,
          price: parseFloat(formData.price),
          condition: formData.condition,
          quantity: parseInt(formData.quantity),
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          is_active: formData.is_active,
        })
        .eq('id', productId)

      if (updateError) throw updateError
      router.push('/seller/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    setFormData({
      ...formData,
      [e.target.name]: target.type === 'checkbox' ? target.checked : e.target.value
    })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Edit Listing</h1>

      {/* Payout warning */}
      {!checkingPayouts && !payoutsReady && (
        <div className="mb-8 rounded-xl border-2 border-yellow-400 bg-yellow-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-cormorant text-xl font-bold text-yellow-900 mb-2">
                Payout Setup Required to Reactivate
              </h3>
              <p className="text-sm text-yellow-800 mb-1 leading-relaxed">
                <strong>You cannot reactivate this listing until you set up your payouts.</strong>
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
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-3">Basic Information</h2>

          <div>
            <label htmlFor="title" className="label block mb-2">Product Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label block mb-2">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="input w-full resize-none"
              required
            />
          </div>
        </div>

        {/* Category & Condition */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-3">Category & Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="label block mb-2">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input w-full"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="label block mb-2">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="input w-full"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond} className="capitalize">
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label htmlFor="subcategory" className="label block mb-2">Subcategory {isCollectibles && <span className="text-gold text-xs">(or create your own)</span>}</label>
            
            {allSubs.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {allSubs.map(sub => {
                  const selected = formData.subcategory === sub
                  const isCustom = isCollectibles && customSubcategories.includes(sub) && !baseSubs.includes(sub)
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => setFormData(prev => ({ ...prev, subcategory: selected ? '' : sub }))}
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
            ) : null}

            {/* Custom subcategory input for Collectibles */}
            {isCollectibles && (
              <div className="mt-2">
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

            {/* Fallback text input for non-collectibles */}
            {!isCollectibles && (
              <input
                id="subcategory"
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="Type a subcategory..."
                className="input w-full"
              />
            )}
          </div>

          <div>
            <label htmlFor="tags" className="label block mb-2">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-3">Pricing & Stock</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="label block mb-2">Price (USD) *</label>
              <div className="flex">
                <span className="input rounded-r-none w-auto shrink-0 flex items-center px-3 bg-neutral-100">$</span>
                <input
                  id="price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="input rounded-l-none flex-1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="label block mb-2">Quantity Available *</label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="input w-full"
                required
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-3">Status</h2>

          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded"
              disabled={!payoutsReady && !checkingPayouts}
            />
            <label htmlFor="is_active" className="label ml-2">
              Active Listing
              {!payoutsReady && !checkingPayouts && (
                <span className="text-yellow-700 text-xs ml-2">
                  (disabled — complete payout setup first)
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={saving || checkingPayouts || (!payoutsReady && formData.is_active)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              !payoutsReady && !checkingPayouts && formData.is_active
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'btn-primary bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {checkingPayouts
              ? 'Checking payout status...'
              : !payoutsReady && formData.is_active
                ? 'Complete Payout Setup to Save'
                : saving
                  ? 'Saving...'
                  : 'Save Changes'}
          </button>
          <Link href="/seller/listings" className="btn-secondary flex-1 py-3 text-center rounded-lg border">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
