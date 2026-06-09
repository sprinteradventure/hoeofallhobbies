'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    'Knitting',
    'Painting',
    'Jewelry',
    'Woodworking',
    'Gardening',
    'Sewing',
    'All'
  ]

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  async function fetchProducts() {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*, seller:user_profiles(*)')
        .eq('is_active', true)

      if (selectedCategory && selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query.order('listing_date', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Search and Filter Section */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-10"
                />
              </div>
              <button className="btn-primary px-6">Search</button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    (category === 'All' ? !selectedCategory : selectedCategory === category)
                      ? 'bg-brand-700 text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">No products found</p>
            <Link href="/" className="btn-primary px-6 py-2">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link
                key={product.id}
                href={`/shop/products/${product.id}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-neutral-200 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      No image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">{product.title}</h3>

                  {/* Seller Info */}
                  {product.seller && (
                    <p className="text-sm text-neutral-600 mb-3">
                      by {product.seller.username || product.seller.full_name || 'Unknown'}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-brand-700">
                      ${product.price.toFixed(2)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-full"
                    >
                      <Heart className="h-5 w-5 text-neutral-400" />
                    </button>
                  </div>

                  {/* Condition Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                      {product.condition}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
