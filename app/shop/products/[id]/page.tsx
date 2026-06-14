'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Share2, ShoppingCart, ArrowLeft, Star, Store, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { CATEGORIES, getSubcategoriesForCategory } from '@/lib/categories'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchProduct()
  }, [productId])

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:user_profiles(*)')
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)

      // Fetch related products
      if (data) {
        const { data: related } = await supabase
          .from('products')
          .select('*, seller:user_profiles(*)')
          .eq('category', data.category)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(4)
        setRelatedProducts(related || [])
      }
    } catch (err) {
      console.error('Error fetching product:', err)
      router.push('/shop/products')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart() {
    try {
      setAddingToCart(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity
        }, {
          onConflict: 'user_id,product_id'
        })

      if (error) throw error
      alert('Added to cart!')
      router.push('/shop/cart')
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-taupe mb-4">Product not found</p>
        <Link href="/shop/products" className="btn btn-primary px-6 py-2">
          Back to Shop
        </Link>
      </div>
    )
  }

  const hasImages = product.images && product.images.length > 0

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-taupe mb-8">
          <Link href="/shop/products" className="hover:text-gold transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span>/</span>
          <span className="text-charcoal font-medium">{product.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-blush shadow-sm">
              {hasImages ? (
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-taupe">
                  <span className="text-5xl">📦</span>
                </div>
              )}
            </div>

            {hasImages && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                      currentImageIndex === idx ? 'border-gold shadow-md' : 'border-blush'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-gold">{product.category}</span>
                {product.subcategory && <span className="badge badge-blush">{product.subcategory}</span>}
              </div>
              <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-charcoal mb-3">{product.title}</h1>
              <p className="text-3xl font-bold text-gold">${product.price.toFixed(2)}</p>
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ivory flex items-center justify-center">
                    <Store className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal">
                      {product.seller.username || product.seller.full_name || 'Unknown Seller'}
                    </p>
                    {product.seller.avg_rating && (
                      <div className="flex items-center gap-1 text-sm text-taupe">
                        <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                        <span>{product.seller.avg_rating}</span>
                        <span>({product.seller.total_reviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="card space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-taupe uppercase tracking-wider mb-1">Condition</p>
                  <p className="font-semibold text-charcoal capitalize">{product.condition.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-taupe uppercase tracking-wider mb-1">Stock</p>
                  <p className="font-semibold text-charcoal">{product.quantity} available</p>
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <p className="text-xs text-taupe uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="badge badge-blush">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card">
              <p className="text-xs text-taupe uppercase tracking-wider mb-2">Description</p>
              <p className="text-charcoal whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>

            {/* Shipping */}
            <div className="card bg-ivory">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-gold" />
                <p className="text-xs text-taupe uppercase tracking-wider">Shipping</p>
              </div>
              <p className="text-sm text-taupe">
                Shipping is calculated at checkout based on your location. The seller will provide tracking once shipped.
              </p>
            </div>

            {/* Add to Cart */}
            {product.quantity > 0 ? (
              <div className="card space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-charcoal">Quantity:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-blush flex items-center justify-center hover:bg-ivory transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="w-10 h-10 rounded-lg border border-blush flex items-center justify-center hover:bg-ivory transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="btn btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                <button className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5" />
                  Save for Later
                </button>
              </div>
            ) : (
              <div className="card bg-red-50 border-red-200">
                <p className="text-red-700 font-semibold">This item is currently out of stock</p>
              </div>
            )}

            <button className="btn btn-ghost w-full py-3 flex items-center justify-center gap-2 border border-blush">
              <Share2 className="h-5 w-5" />
              Share Product
            </button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map(p => (
                <Link
                  key={p.id}
                  href={`/shop/products/${p.id}`}
                  className="group bg-white rounded-xl border border-blush overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-square bg-ivory overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📦</span></div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gold font-semibold uppercase tracking-wider">{p.category}</p>
                    <h3 className="font-cormorant text-base font-bold text-charcoal mt-1 line-clamp-1">{p.title}</h3>
                    <p className="text-lg font-bold text-charcoal mt-2">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
