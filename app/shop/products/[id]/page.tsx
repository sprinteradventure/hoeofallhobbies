'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Share2, ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
        <p className="text-neutral-600 mb-4">Product not found</p>
        <Link href="/shop/products" className="btn-primary px-6 py-2">
          Back to Products
        </Link>
      </div>
    )
  }

  const hasImages = product.images && product.images.length > 0

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex gap-2 text-sm text-neutral-600 mb-8">
          <Link href="/shop/products" className="hover:text-neutral-900">Products</Link>
          <span>/</span>
          <span className="text-neutral-900">{product.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="aspect-square bg-neutral-200 rounded-lg overflow-hidden">
              {hasImages ? (
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {hasImages && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded border-2 overflow-hidden ${
                      currentImageIndex === idx ? 'border-brand-700' : 'border-neutral-200'
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
            {/* Title and Price */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
              <p className="text-neutral-600 mb-4">{product.category}</p>
              <p className="text-4xl font-bold text-brand-700">${product.price.toFixed(2)}</p>
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="card">
                <h3 className="font-semibold mb-2">Seller</h3>
                <Link
                  href={`/seller/${product.seller.id}`}
                  className="text-brand-700 hover:underline"
                >
                  {product.seller.username || product.seller.full_name || 'Unknown'}
                </Link>
                {product.seller.avg_rating && (
                  <p className="text-sm text-neutral-600 mt-2">
                    Rating: {product.seller.avg_rating} ({product.seller.total_reviews} reviews)
                  </p>
                )}
              </div>
            )}

            {/* Product Info */}
            <div className="card space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Condition</h3>
                <p className="text-neutral-600 capitalize">{product.condition}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Available</h3>
                <p className="text-neutral-600">
                  {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                </p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span key={tag} className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card">
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-neutral-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Add to Cart Section */}
            {product.quantity > 0 ? (
              <div className="card space-y-4">
                <div>
                  <label className="label block mb-2">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 border rounded hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="text-xl font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="px-4 py-2 border rounded hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                <button className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5" />
                  Save for Later
                </button>
              </div>
            ) : (
              <div className="card bg-red-50 border-red-200">
                <p className="text-red-700 font-semibold">This item is currently out of stock</p>
              </div>
            )}

            {/* Share */}
            <button className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
