'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CATEGORIES, getSubcategoriesForCategory } from '@/lib/categories'
import { Upload, Plus, X, ChevronDown } from 'lucide-react'

const CONDITIONS = ['new', 'like-new', 'used', 'damaged']

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0].name,
    subcategory: '',
    price: '',
    condition: CONDITIONS[0],
    quantity: '1',
    tags: '',
  })

  const availableSubcategories = getSubcategoriesForCategory(formData.category)

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
          images: imageUrls.length > 0 ? imageUrls : [],
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
      ...(name === 'category' ? { subcategory: '' } : {})
    }))
  }

  function addImage() {
    if (imageInput.trim()) {
      setImageUrls([...imageUrls, imageInput.trim()])
      setImageInput('')
    }
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Create New Listing</h1>
        <p className="text-taupe font-lora">List your craft and hobby supplies. You keep 95% of every sale.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-8">
        {/* Images */}
        <div className="space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-charcoal border-b border-blush pb-3">Product Images</h2>
          
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Image URL (e.g., from Cloudinary, Imgur...)"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              className="input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <button type="button" onClick={addImage} className="btn btn-ghost border border-blush px-4">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-blush">
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label block mb-2">Subcategory</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="input"
                disabled={availableSubcategories.length === 0}
              >
                <option value="">Select subcategory...</option>
                {availableSubcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

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
              <span className="input rounded-r-none flex items-center px-4 bg-ivory text-taupe border-r-0">$</span>
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
          <div className="bg-ivory rounded-lg p-4 border border-blush">
            <p className="text-sm text-taupe">
              <span className="font-semibold text-charcoal">Shipping setup:</span> You can configure shipping labels and carriers from your 
              <Link href="/seller/dashboard" className="text-gold hover:underline ml-1">Seller Dashboard</Link> after creating this listing. 
              Buyers will see "Shipping calculated at checkout" until you set up your preferred carrier.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-blush">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 py-3"
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
          <Link href="/seller/listings" className="btn btn-secondary flex-1 py-3 text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
