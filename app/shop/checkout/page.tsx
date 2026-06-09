'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { CartItem, Order } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

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
        .select('*, product:products(id, seller_id, price, title)')
        .eq('user_id', user.id)

      setCartItems(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const shippingAddress = { fullName, address, city, state, zip }

      // Create orders for each seller (grouped by seller)
      const sellerOrders = new Map<string, CartItem[]>()
      cartItems.forEach(item => {
        const sellerId = (item.product as any).seller_id
        if (!sellerOrders.has(sellerId)) {
          sellerOrders.set(sellerId, [])
        }
        sellerOrders.get(sellerId)!.push(item)
      })

      // Create order records
      for (const [sellerId, items] of sellerOrders.entries()) {
        const totalPrice = items.reduce((sum, item) => {
          return sum + ((item.product as any).price * item.quantity)
        }, 0)

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: items[0].product_id,
            quantity: items[0].quantity,
            total_price: totalPrice,
            shipping_address: shippingAddress,
            status: 'pending',
          })
          .select()

        if (orderError) throw orderError
      }

      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', user.id)

      router.push('/shop/orders')
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Checkout failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const total = cartItems.reduce((sum, item) => {
    return sum + ((item.product as any)?.price || 0) * item.quantity
  }, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input w-full"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              <p className="text-neutral-600 mb-4">
                Stripe integration coming soon. For now, orders are created in pending status.
              </p>
              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full py-3"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="card h-fit sticky top-20">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 pb-4 border-b">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{(item.product as any).title} x{item.quantity}</span>
                <span>${(((item.product as any).price * item.quantity).toFixed(2))}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
