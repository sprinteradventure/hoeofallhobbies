'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Truck, Package, CheckCircle, AlertCircle } from 'lucide-react'

export default function SellerShippingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    ship_name: '',
    ship_street1: '',
    ship_street2: '',
    ship_city: '',
    ship_state: '',
    ship_zip: '',
    default_length_in: '',
    default_width_in: '',
    default_height_in: '',
    default_weight_oz: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select(
          'ship_name, ship_street1, ship_street2, ship_city, ship_state, ship_zip, default_length_in, default_width_in, default_height_in, default_weight_oz'
        )
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          ship_name: profile.ship_name || '',
          ship_street1: profile.ship_street1 || '',
          ship_street2: profile.ship_street2 || '',
          ship_city: profile.ship_city || '',
          ship_state: profile.ship_state || '',
          ship_zip: profile.ship_zip || '',
          default_length_in: profile.default_length_in?.toString() || '',
          default_width_in: profile.default_width_in?.toString() || '',
          default_height_in: profile.default_height_in?.toString() || '',
          default_weight_oz: profile.default_weight_oz?.toString() || '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/seller/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...form,
          ship_country: 'US',
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save shipping settings.')

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shipping settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal">Shipping Settings</h1>
        <p className="text-taupe font-lora mt-1">
          Where your orders ship from, and the box you usually ship in
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Shipping settings saved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ship-from address */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Truck className="h-5 w-5 text-gold" />
            <h2 className="font-cormorant text-xl font-bold text-charcoal">Ship-From Address</h2>
          </div>
          <p className="text-sm text-taupe mb-5">
            This is the return/origin address printed on your shipping labels and used to
            calculate real carrier rates at checkout.
          </p>
          <div className="space-y-3">
            <div>
              <label className="label block mb-2">Name *</label>
              <input
                type="text"
                name="ship_name"
                value={form.ship_name}
                onChange={handleChange}
                placeholder="Your name or shop name"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label block mb-2">Street Address *</label>
              <input
                type="text"
                name="ship_street1"
                value={form.ship_street1}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label block mb-2">Apt / Suite (optional)</label>
              <input
                type="text"
                name="ship_street2"
                value={form.ship_street2}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-2">City *</label>
                <input
                  type="text"
                  name="ship_city"
                  value={form.ship_city}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label block mb-2">State *</label>
                <input
                  type="text"
                  name="ship_state"
                  value={form.ship_state}
                  onChange={handleChange}
                  placeholder="e.g. CA"
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-2">ZIP Code *</label>
                <input
                  type="text"
                  name="ship_zip"
                  value={form.ship_zip}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label block mb-2">Country</label>
                <input type="text" value="United States" className="input bg-ivory" disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Default parcel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Package className="h-5 w-5 text-gold" />
            <h2 className="font-cormorant text-xl font-bold text-charcoal">Default Parcel</h2>
          </div>
          <p className="text-sm text-taupe mb-5">
            Used for shipping quotes whenever a listing doesn&apos;t set its own weight or
            dimensions. If left blank, a 9 × 6 × 3 in box is assumed and each item defaults
            to 8 oz.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label block mb-2">Length (in)</label>
              <input
                type="number"
                name="default_length_in"
                value={form.default_length_in}
                onChange={handleChange}
                placeholder="9"
                step="0.1"
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-2">Width (in)</label>
              <input
                type="number"
                name="default_width_in"
                value={form.default_width_in}
                onChange={handleChange}
                placeholder="6"
                step="0.1"
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-2">Height (in)</label>
              <input
                type="number"
                name="default_height_in"
                value={form.default_height_in}
                onChange={handleChange}
                placeholder="3"
                step="0.1"
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-2">Weight (oz)</label>
              <input
                type="number"
                name="default_weight_oz"
                value={form.default_weight_oz}
                onChange={handleChange}
                placeholder="8"
                step="0.1"
                min="0"
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card bg-ivory">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-taupe">
              <span className="font-semibold text-charcoal">How it works:</span> buyers see real
              carrier rates at checkout based on this address. When an order is paid, a USPS
              shipping label is generated automatically — print it from your orders page. Label
              costs are covered by the shipping the buyer pays.
            </p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary w-full py-3">
          {saving ? 'Saving...' : 'Save Shipping Settings'}
        </button>
      </form>

      <div className="mt-6">
        <Link href="/seller/dashboard" className="text-sm text-gold hover:underline">
          ← Back to Seller Dashboard
        </Link>
      </div>
    </div>
  )
}
