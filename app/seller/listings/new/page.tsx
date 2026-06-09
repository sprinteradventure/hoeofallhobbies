'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

const CATEGORIES = ['Knitting', 'Painting', 'Jewelry', 'Woodworking', 'Gardening', 'Sewing']
const CONDITIONS = ['new', 'like-new', 'used', 'damaged']

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    subcategory: '',
    price: '',
    condition: CONDITIONS[0],
    quantity: '1',
    tags: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || null,
          price: parseFloat(formData.price),
          condition: formData.condition,
          quantity: parseInt(formData.quantity),
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          is_active: true,
          images: [],
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">Create New Listing</h1>
      </div>

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
              placeholder="What are you selling?"
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
              placeholder="Describe your item in detail..."
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
                  <option key={cat} value={cat}>{cat}</option>
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

          <div>
            <label htmlFor="subcategory" className="label block mb-2">Subcategory (optional)</label>
            <input
              id="subcategory"
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              placeholder="E.g., Yarn, Brushes, etc."
              className="input w-full"
            />
          </div>

          <div>
            <label htmlFor="tags" className="label block mb-2">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="handmade, organic, vintage, etc."
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
                <span className="input rounded-r-none flex items-center px-3 bg-neutral-100">$</span>
                <input
                  id="price"
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

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-3"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
          <Link href="/seller/listings" className="btn-secondary flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
