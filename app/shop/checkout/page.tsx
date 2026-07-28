'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CartItem } from '@/lib/types'
import { Truck, CreditCard, MapPin, Package, ChevronRight, Shield, Store, AlertCircle } from 'lucide-react'

type SellerInfo = {
  username?: string | null
  stripe_payouts_enabled?: boolean | null
}

type SellerGroup = {
  sellerId: string
  items: CartItem[]
  subtotal: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [sellerInfo, setSellerInfo] = useState<Record<string, SellerInfo>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processingSeller, setProcessingSeller] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [checkoutError, setCheckoutError] = useState('')
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({})

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

      const items = data || []
      setCartItems(items)

      // Load each seller's public profile (shop name + payout status) so
      // multi-seller carts can be grouped per shop and unavailable groups
      // are flagged before the buyer clicks. Profiles are publicly readable.
      const sellerIds = Array.from(
        new Set(items.map((item: any) => item.product?.seller_id).filter(Boolean))
      ) as string[]
      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, stripe_payouts_enabled')
          .in('id', sellerIds)

        const map: Record<string, SellerInfo> = {}
        for (const p of profiles || []) map[p.id] = p
        setSellerInfo(map)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout(sellerId?: string) {
    setProcessing(true)
    setProcessingSeller(sellerId ?? null)
    setCheckoutError('')
    if (sellerId) {
      setGroupErrors((prev) => ({ ...prev, [sellerId]: '' }))
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const shippingAddress = { fullName, address, city, state, zip, phone, method: shippingMethod }

      // The server loads the cart, checks/decrements stock, creates
      // payment_pending orders + order_items, and returns a Stripe Checkout
      // URL. Prices are computed server-side from the database. When
      // sellerId is passed, only that seller's items are checked out (a
      // Stripe session can pay out to exactly one connected account).
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ shippingAddress, seller_id: sellerId ?? null }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.status === 501 && data?.code === 'STRIPE_NOT_CONFIGURED') {
        setCheckoutError(
          'Online payments are being set up right now. Please check back shortly — your cart is saved.'
        )
        return
      }

      if (res.status === 409 && data?.code === 'SELLER_PAYOUTS_NOT_SETUP' && sellerId) {
        setGroupErrors((prev) => ({ ...prev, [sellerId]: data.error }))
        return
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Checkout failed. Please try again.')
      }

      // Redirect to Stripe-hosted checkout. Purchased items are cleared by
      // the webhook once payment succeeds; other sellers' items stay in the
      // cart for their own checkout.
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      if (sellerId) {
        setGroupErrors((prev) => ({
          ...prev,
          [sellerId]: err instanceof Error ? err.message : 'Checkout failed. Please try again.',
        }))
      } else {
        setCheckoutError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
      }
    } finally {
      setProcessing(false)
      setProcessingSeller(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Single-seller carts keep the classic one-button flow. Multi-seller
    // carts use per-group buttons (type="button") below instead.
    if (sellerGroups.length === 1) {
      handleCheckout(undefined)
    }
  }

  function handleGroupCheckout(sellerId: string) {
    if (!formRef.current?.reportValidity()) return
    handleCheckout(sellerId)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const total = cartItems.reduce((sum, item) => {
    return sum + ((item.product as any)?.price || 0) * item.quantity
  }, 0)

  const shippingEstimate = shippingMethod === 'express' ? 15.00 : 5.99
  const grandTotal = total + shippingEstimate

  // Group cart items by seller shop.
  const groupsMap = new Map<string, CartItem[]>()
  for (const item of cartItems) {
    const sellerId = (item.product as any)?.seller_id || 'unknown'
    if (!groupsMap.has(sellerId)) groupsMap.set(sellerId, [])
    groupsMap.get(sellerId)!.push(item)
  }
  const sellerGroups: SellerGroup[] = Array.from(groupsMap.entries()).map(([sellerId, items]) => ({
    sellerId,
    items,
    subtotal: items.reduce((sum, item) => sum + ((item.product as any)?.price || 0) * item.quantity, 0),
  }))
  const isMultiSeller = sellerGroups.length > 1

  function sellerName(sellerId: string) {
    return sellerInfo[sellerId]?.username || 'this seller'
  }

  function sellerPayoutsReady(sellerId: string) {
    return sellerInfo[sellerId]?.stripe_payouts_enabled === true
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-3 space-y-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                  You&apos;ll be redirected to Stripe&apos;s secure checkout to complete payment. Your order is confirmed once payment succeeds.
                </p>

                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                    {checkoutError}
                  </div>
                )}

                {isMultiSeller ? (
                  <div className="space-y-4">
                    <p className="text-sm text-taupe">
                      Your cart has items from {sellerGroups.length} sellers. Each seller is paid
                      directly, so you&apos;ll check out with each one separately — the shipping
                      details above are used for all of them.
                    </p>
                    {sellerGroups.map((group) => {
                      const ready = sellerPayoutsReady(group.sellerId)
                      const groupError = groupErrors[group.sellerId]
                      return (
                        <div key={group.sellerId} className="rounded-xl border border-blush bg-white p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-gold" />
                              <p className="font-semibold text-charcoal text-sm">
                                {sellerName(group.sellerId)}
                              </p>
                              <span className="text-xs text-taupe">
                                {group.items.length} item{group.items.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <p className="font-bold text-charcoal">${group.subtotal.toFixed(2)}</p>
                          </div>

                          {ready ? (
                            <button
                              type="button"
                              onClick={() => handleGroupCheckout(group.sellerId)}
                              disabled={processing}
                              className="btn btn-primary w-full py-3"
                            >
                              {processing && processingSeller === group.sellerId
                                ? 'Redirecting to Payment...'
                                : `Checkout with this seller — $${group.subtotal.toFixed(2)}`}
                            </button>
                          ) : (
                            <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-yellow-800">
                                {sellerName(group.sellerId)} hasn&apos;t set up payouts yet, so
                                these items are temporarily unavailable. Please check back later —
                                your cart is saved.
                              </p>
                            </div>
                          )}

                          {groupError && (
                            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                              {groupError}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    {!sellerPayoutsReady(sellerGroups[0]?.sellerId) && sellerGroups.length === 1 ? (
                      <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          {sellerName(sellerGroups[0].sellerId)} hasn&apos;t set up payouts yet, so
                          these items are temporarily unavailable. Please check back later — your
                          cart is saved.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={processing}
                        className="btn btn-primary w-full py-3.5"
                      >
                        {processing ? 'Redirecting to Payment...' : 'Place Order'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-5">Order Summary</h2>
            <div className="space-y-4 mb-5 pb-5 border-b border-blush">
              {sellerGroups.map((group) => (
                <div key={group.sellerId} className="space-y-4">
                  {isMultiSeller && (
                    <div className="flex items-center gap-2 pt-1">
                      <Store className="h-3.5 w-3.5 text-gold" />
                      <p className="text-xs font-semibold text-taupe uppercase tracking-wide">
                        {sellerName(group.sellerId)}
                      </p>
                    </div>
                  )}
                  {group.items.map(item => (
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
            {isMultiSeller && (
              <p className="text-xs text-taupe mt-3">
                Checked out per seller — each seller&apos;s button above shows their items&apos;
                subtotal. Shipping is settled with each seller.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
