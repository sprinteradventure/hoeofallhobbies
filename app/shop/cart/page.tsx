'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react'
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
        <div className="w-20 h-20 rounded-full bg-ivory flex items-center justify-center mb-6">
          <ShoppingCart className="h-10 w-10 text-taupe" />
        </div>
        <h1 className="font-cormorant text-3xl font-bold text-charcoal mb-2">Your cart is empty</h1>
        <p className="text-taupe mb-8 font-lora">Start shopping to add items to your cart</p>
        <Link href="/shop/products" className="btn btn-primary px-8 py-3">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product as any
            return (
              <div key={item.id} className="card flex gap-4 items-start">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-cormorant text-lg font-bold text-charcoal">{product.title}</h3>
                  <p className="text-sm text-taupe">{product.category}</p>
                  <p className="text-gold font-bold text-lg mt-1">${product.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-blush flex items-center justify-center hover:bg-ivory"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-blush flex items-center justify-center hover:bg-ivory"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-bold text-charcoal">${(product.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-cormorant text-xl font-bold text-charcoal mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 pb-4 border-b border-blush">
            <div className="flex justify-between text-sm">
              <span className="text-taupe">Subtotal</span>
              <span className="font-semibold text-charcoal">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-taupe">Shipping</span>
              <span className="text-taupe">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-taupe">Tax</span>
              <span className="text-taupe">Calculated at checkout</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold mb-6">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">${total.toFixed(2)}</span>
          </div>
          <Link href="/shop/checkout" className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/shop/products" className="btn btn-ghost w-full py-3 text-center mt-2 border border-blush">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
