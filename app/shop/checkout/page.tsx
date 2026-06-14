'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CartItem, Order } from '@/lib/types'
import { Truck, CreditCard, MapPin, Package, ChevronRight, Shield } from 'lucide-react'

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
  const [phone, setPhone] = useState('')
  const [shippingMethod, setShippingMethod] = useState('standard')

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
        .select('*, product:products(id, seller_id, price, title, images, category)')
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

      const shippingAddress = { fullName, address, city, state, zip, phone, method: shippingMethod }

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
            quantity: items.reduce((sum, item) => sum + item.quantity, 0),
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

  const shippingEstimate = shippingMethod === 'express' ? 15.00 : 5.99
  const grandTotal = total + shippingEstimate

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleCheckout} className="space-y-6">
            {/* Shipping Address */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="h-5 w-5 text-gold" />
                <h2 className="font-cormorant text-xl font-bold text-charcoal">Shipping Address</h2>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ZIP Code *"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="input"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <Truck className="h-5 w-5 text-gold" />
                <h2 className="font-cormorant text-xl font-bold text-charcoal">Shipping Method</h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  shippingMethod === 'standard' ? 'border-gold bg-gold/5' : 'border-blush'
                }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-4 h-4 accent-gold"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal">Standard Shipping</p>
                    <p className="text-sm text-taupe">5-7 business days</p>
                  </div>
                  <span className="font-bold text-charcoal">$5.99</span>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  shippingMethod === 'express' ? 'border-gold bg-gold/5' : 'border-blush'
                }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-4 h-4 accent-gold"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal">Express Shipping</p>
                    <p className="text-sm text-taupe">2-3 business days</p>
                  </div>
                  <span className="font-bold text-charcoal">$15.00</span>
                </label>

                <div className="bg-ivory rounded-lg p-4 border border-blush">
                  <p className="text-sm text-taupe">
                    <span className="font-semibold text-charcoal">Note:</span> The seller will generate a shipping label and provide tracking once the order is processed. You can configure preferred carriers in your account settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="h-5 w-5 text-gold" />
                <h2 className="font-cormorant text-xl font-bold text-charcoal">Payment</h2>
              </div>
              <div className="bg-ivory rounded-lg p-5 border border-blush">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-gold" />
                  <p className="font-semibold text-charcoal">Secure Payment</p>
                </div>
                <p className="text-sm text-taupe mb-4">
                  Stripe integration is coming soon. For now, orders are placed in "pending" status and the seller will coordinate payment directly. You will receive an email with payment instructions.
                </p>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn btn-primary w-full py-3.5"
                >
                  {processing ? 'Processing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-5">Order Summary</h2>
            <div className="space-y-4 mb-5 pb-5 border-b border-blush">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3">
                  {(item.product as any)?.images?.[0] && (
                    <img
                      src={(item.product as any).images[0]}
                      alt={(item.product as any).title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-charcoal line-clamp-1">{(item.product as any).title}</p>
                    <p className="text-xs text-taupe">{(item.product as any).category}</p>
                    <p className="text-sm text-taupe">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-charcoal">
                    ${(((item.product as any).price * item.quantity).toFixed(2))}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-taupe">Subtotal</span>
                <span className="text-charcoal">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-taupe">Shipping</span>
                <span className="text-charcoal">${shippingEstimate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-taupe">Tax</span>
                <span className="text-taupe">Calculated</span>
              </div>
            </div>
            <div className="flex justify-between text-xl font-bold pt-4 border-t border-blush">
              <span className="text-charcoal">Total</span>
              <span className="text-charcoal">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
