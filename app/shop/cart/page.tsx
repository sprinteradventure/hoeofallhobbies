'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { CartItem } from '@/lib/types'

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCart()
  }, [])

  async function fetchCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', user.id)

      setCartItems(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function removeFromCart(cartItemId: string) {
    await supabase.from('cart_items').delete().eq('id', cartItemId)
    fetchCart()
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
    fetchCart()
  }

  const total = cartItems.reduce((sum, item) => {
    return sum + ((item.product as any)?.price || 0) * item.quantity
  }, 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <ShoppingCart className="h-16 w-16 text-neutral-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-neutral-600 mb-6">Start shopping to add items to your cart</p>
        <Link href="/shop/products" className="btn-primary px-6 py-2">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product as any
            return (
              <div key={item.id} className="card flex gap-4">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  <p className="text-brand-700 font-bold">${product.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 border rounded"
                    >
                      −
                    </button>
                    <span className="px-3">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 border rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(product.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="card h-fit sticky top-20">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4 pb-4 border-b">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold mb-6">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Link href="/shop/checkout" className="btn-primary w-full py-3 text-center">
            Proceed to Checkout
          </Link>
          <Link href="/shop/products" className="btn-secondary w-full py-3 text-center mt-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
