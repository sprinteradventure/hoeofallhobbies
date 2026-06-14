'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Heart, Filter, ChevronDown, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { CATEGORIES, getSubcategoriesForCategory } from '@/lib/categories'

import { Suspense } from 'react'

export default function ProductsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-blush rounded"></div>
        </div>
      </div>
    }>
      <ProductsPage />
    </Suspense>
  )
}

function ProductsPage() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(urlCategory)
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(urlCategory)

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory)
      setExpandedCategory(urlCategory)
    }
  }, [urlCategory])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, selectedSubcategory])

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
      
      if (selectedSubcategory) {
        query = query.eq('subcategory', selectedSubcategory)
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
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const activeFilters = [
    selectedCategory && selectedCategory !== 'All' ? selectedCategory : null,
    selectedSubcategory ? selectedSubcategory : null
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-blush sticky top-20 z-40">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-taupe" />
                <input
                  type="search"
                  placeholder="Search products, tags, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-11"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`btn px-4 ${showFilters ? 'btn-primary' : 'btn-ghost border border-blush'}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="ml-2 bg-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-taupe">Active:</span>
                {activeFilters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => {
                      if (filter === selectedCategory) {
                        setSelectedCategory('')
                        setSelectedSubcategory('')
                        setExpandedCategory(null)
                      } else {
                        setSelectedSubcategory('')
                      }
                    }}
                    className="badge badge-gold flex items-center gap-1"
                  >
                    {filter}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button 
                  onClick={() => {
                    setSelectedCategory('')
                    setSelectedSubcategory('')
                    setExpandedCategory(null)
                  }}
                  className="text-sm text-gold hover:underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Category Filters */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-5 border border-blush sticky top-40">
                <h3 className="font-cormorant text-xl font-bold text-charcoal mb-4">
                  Categories
                </h3>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSelectedSubcategory('')
                      setExpandedCategory(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory ? 'bg-gold/10 text-gold font-semibold' : 'text-charcoal hover:bg-ivory'
                    }`}
                  >
                    All Products
                  </button>

                  {CATEGORIES.map((category) => {
                    const subcategories = getSubcategoriesForCategory(category.name)
                    const isExpanded = expandedCategory === category.name
                    const isActive = selectedCategory === category.name
                    
                    return (
                      <div key={category.slug}>
                        <button
                          onClick={() => {
                            if (isActive) {
                              setSelectedCategory('')
                              setSelectedSubcategory('')
                              setExpandedCategory(null)
                            } else {
                              setSelectedCategory(category.name)
                              setSelectedSubcategory('')
                              setExpandedCategory(category.name)
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            isActive ? 'bg-gold/10 text-gold font-semibold' : 'text-charcoal hover:bg-ivory'
                          }`}
                        >
                          <span>{category.name}</span>
                          {subcategories.length > 0 && (
                            <ChevronDown 
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          )}
                        </button>

                        {isExpanded && subcategories.length > 0 && (
                          <div className="pl-3 mt-1 space-y-0.5">
                            {subcategories.map((sub) => (
                              <button
                                key={sub}
                                onClick={() => {
                                  setSelectedSubcategory(sub === selectedSubcategory ? '' : sub)
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                                  selectedSubcategory === sub 
                                    ? 'text-gold font-semibold bg-gold/5' 
                                    : 'text-taupe hover:text-gold hover:bg-white'
                                }`}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Products */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-taupe text-sm">
                {loading ? (
                  'Loading products...'
                ) : (
                  <>
                    <span className="font-semibold text-charcoal">{filteredProducts.length}</span> product
                    {filteredProducts.length !== 1 ? 's' : ''} found
                    {selectedCategory && ` in ${selectedCategory}`}
                    {selectedSubcategory && ` > ${selectedSubcategory}`}
                  </>
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-48 bg-blush rounded"></div>
                  <div className="h-4 w-32 bg-blush rounded"></div>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-charcoal font-semibold mb-2">No products found</p>
                <p className="text-taupe text-sm mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('')
                    setSelectedSubcategory('')
                  }}
                  className="btn btn-primary px-6 py-2"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/shop/products/${product.id}`}
                    className="group bg-white rounded-xl border border-blush overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-ivory overflow-hidden relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <Heart className="h-4 w-4 text-taupe hover:text-red-500 transition-colors" />
                      </button>
                      <span className="badge badge-blush absolute bottom-3 left-3">
                        {product.condition}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <p className="text-xs text-gold font-semibold uppercase tracking-wider mb-1">
                        {product.category}
                        {product.subcategory && ` · ${product.subcategory}`}
                      </p>
                      <h3 className="font-cormorant text-lg font-bold text-charcoal mb-1 line-clamp-2 group-hover:text-gold transition-colors">
                        {product.title}
                      </h3>
                      {product.seller && (
                        <p className="text-xs text-taupe mb-3">
                          by {product.seller.username || product.seller.full_name || 'Unknown'}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-charcoal">
                          ${product.price.toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.quantity > 0 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
