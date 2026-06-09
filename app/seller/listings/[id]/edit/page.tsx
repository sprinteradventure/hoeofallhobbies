'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'

const CATEGORIES = ['Knitting', 'Painting', 'Jewelry', 'Woodworking', 'Gardening', 'Sewing']
const CONDITIONS = ['new', 'like-new', 'used', 'damaged']

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    is_active: true,
  })

  useEffect(() => {
    loadProduct()
  }, [productId])

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
        category: data.category,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
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
            />
            <label htmlFor="is_active" className="label ml-2">Active Listing</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 py-3"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/seller/listings" className="btn-secondary flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
