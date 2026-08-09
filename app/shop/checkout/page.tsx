'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CartItem } from '@/lib/types'
import ListingImage from '@/components/shop/ListingImage'
import { Truck, CreditCard, MapPin, Package, ChevronRight, Shield, Store, AlertCircle, RefreshCw } from 'lucide-react'

type SellerInfo = {
  username?: string | null
  stripe_payouts_enabled?: boolean | null
}

type SellerGroup = {
  sellerId: string
  items: CartItem[]
  subtotal: number
}

type RateOption = {
  rateId: string
  carrier: string
  serviceLevel: string
  amount: number
  currency: string
  estimatedDays: number | null
}

type GroupRates = {
  status: 'loading' | 'ready' | 'error' | 'not_setup'
  shipmentId?: string
  rates?: RateOption[]
  selectedRateId?: string
  message?: string
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
  const [street1, setStreet1] = useState('')
  const [street2, setStreet2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({})
  const [groupRates, setGroupRates] = useState<Record<string, GroupRates>>({})

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

  // --------------------------------------------------------------------------
  // Real shipping rates (Shippo). Once the address is complete we quote each
  // seller group independently; a failure in one group never blocks others.
  // Any address edit invalidates quotes and re-fetches (debounced).
  // --------------------------------------------------------------------------
  const addressComplete = [fullName, street1, city, state, zip].every((v) => v.trim().length > 0)

  const buyerAddress = {
    name: fullName.trim(),
    street1: street1.trim(),
    street2: street2.trim() || undefined,
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
  }

  const cartSellerIds = Array.from(
    new Set(cartItems.map((item: any) => item.product?.seller_id).filter(Boolean))
  ) as string[]

  useEffect(() => {
    if (!addressComplete || cartSellerIds.length === 0) {
      setGroupRates({})
      return
    }
    const timer = setTimeout(() => {
      fetchAllRates(cartSellerIds)
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, street1, street2, city, state, zip, cartItems])

  async function fetchAllRates(sellerIds: string[]) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setGroupRates((prev) => {
      const next: Record<string, GroupRates> = {}
      for (const id of sellerIds) next[id] = { status: 'loading' }
      return next
    })

    await Promise.all(
      sellerIds.map(async (sellerId) => {
        try {
          const res = await fetch('/api/shipping/rates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ seller_id: sellerId, address: buyerAddress }),
          })
          const data = await res.json().catch(() => ({}))

          if (res.status === 409 && data?.code === 'SELLER_SHIPPING_NOT_SETUP') {
            setGroupRates((prev) => ({
              ...prev,
              [sellerId]: { status: 'not_setup', message: data.error },
            }))
            return
          }
          if (!res.ok || !Array.isArray(data?.rates) || data.rates.length === 0) {
            setGroupRates((prev) => ({
              ...prev,
              [sellerId]: {
                status: 'error',
                message: data?.error || 'Shipping unavailable, try again',
              },
            }))
            return
          }

          const rates = data.rates as RateOption[]
          const cheapest = [...rates].sort((a, b) => a.amount - b.amount)[0]
          setGroupRates((prev) => ({
            ...prev,
            [sellerId]: {
              status: 'ready',
              shipmentId: data.shipmentId,
              rates,
              selectedRateId: cheapest.rateId,
            },
          }))
        } catch {
          setGroupRates((prev) => ({
            ...prev,
            [sellerId]: { status: 'error', message: 'Shipping unavailable, try again' },
          }))
        }
      })
    )
  }

  function selectRate(sellerId: string, rateId: string) {
    setGroupRates((prev) => ({
      ...prev,
      [sellerId]: { ...prev[sellerId], selectedRateId: rateId },
    }))
  }

  function selectedRate(sellerId: string): RateOption | null {
    const g = groupRates[sellerId]
    if (!g || g.status !== 'ready' || !g.rates) return null
    return g.rates.find((r) => r.rateId === g.selectedRateId) || null
  }

  function groupReadyToCheckout(sellerId: string): boolean {
    return addressComplete && selectedRate(sellerId) !== null
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

      // Attach the buyer-selected Shippo rate. The server re-fetches the rate
      // from Shippo and charges ITS amount — the quoted price shown here is
      // never trusted. sellerId always identifies the group (single-seller
      // carts pass it too, which the server accepts).
      const shippingSelection = sellerId
        ? (() => {
            const g = groupRates[sellerId]
            const rate = selectedRate(sellerId)
            if (!g?.shipmentId || !rate) return null
            return { shipmentId: g.shipmentId, rateId: rate.rateId, address: buyerAddress }
          })()
        : null

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          seller_id: sellerId ?? null,
          ...(shippingSelection ? { shipping: shippingSelection } : {}),
        }),
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
      handleCheckout(sellerGroups[0].sellerId)
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

  const selectedShippingTotal = sellerGroups.reduce(
    (sum, group) => sum + (selectedRate(group.sellerId)?.amount || 0),
    0
  )
  const grandTotal = total + selectedShippingTotal

  function sellerName(sellerId: string) {
    return sellerInfo[sellerId]?.username || 'this seller'
  }

  function sellerPayoutsReady(sellerId: string) {
    return sellerInfo[sellerId]?.stripe_payouts_enabled === true
  }

  function groupTotal(group: SellerGroup): number {
    return group.subtotal + (selectedRate(group.sellerId)?.amount || 0)
  }

  function renderRates(sellerId: string) {
    const g = groupRates[sellerId]

    if (!addressComplete) {
      return (
        <p className="text-xs text-taupe italic">
          Enter your shipping address above to see real carrier rates.
        </p>
      )
    }
    if (!g || g.status === 'loading') {
      return <p className="text-xs text-taupe italic">Fetching live shipping rates...</p>
    }
    if (g.status === 'not_setup') {
      return (
        <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">{g.message}</p>
        </div>
      )
    }
    if (g.status === 'error') {
      return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{g.message || 'Shipping unavailable, try again'}</p>
          <button
            type="button"
            onClick={() => fetchAllRates([sellerId])}
            className="btn btn-ghost py-1.5 px-3 text-xs border border-red-200 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {g.rates!.map((rate) => (
          <label
            key={rate.rateId}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              g.selectedRateId === rate.rateId ? 'border-gold bg-gold/5' : 'border-blush'
            }`}
          >
            <input
              type="radio"
              name={`shipping-${sellerId}`}
              checked={g.selectedRateId === rate.rateId}
              onChange={() => selectRate(sellerId, rate.rateId)}
              className="w-4 h-4 accent-gold"
            />
            <div className="flex-1">
              <p className="font-semibold text-charcoal text-sm">
                {rate.carrier} {rate.serviceLevel}
              </p>
              <p className="text-xs text-taupe">
                {rate.estimatedDays
                  ? `Est. ${rate.estimatedDays} business day${rate.estimatedDays === 1 ? '' : 's'}`
                  : 'Estimated delivery shown at checkout'}
              </p>
            </div>
            <span className="font-bold text-charcoal">${rate.amount.toFixed(2)}</span>
          </label>
        ))}
      </div>
    )
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
                  value={street1}
                  onChange={(e) => setStreet1(e.target.value)}
                  className="input"
                  required
                />
                <input
                  type="text"
                  placeholder="Apt, suite, etc. (optional)"
                  value={street2}
                  onChange={(e) => setStreet2(e.target.value)}
                  className="input"
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
                </div>
              </div>
            </div>

            {/* Payment + per-seller shipping selection */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="h-5 w-5 text-gold" />
                <h2 className="font-cormorant text-xl font-bold text-charcoal">Shipping & Payment</h2>
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
                      Your cart has items from {sellerGroups.length} sellers. Each seller ships and
                      is paid separately, so you&apos;ll check out with each one — pick a shipping
                      option for each shop below.
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
                            <div className="text-right">
                              <p className="font-bold text-charcoal">${groupTotal(group).toFixed(2)}</p>
                              {selectedRate(group.sellerId) && (
                                <p className="text-xs text-taupe">
                                  ${group.subtotal.toFixed(2)} + ${selectedRate(group.sellerId)!.amount.toFixed(2)} shipping
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-4 w-4 text-gold" />
                              <p className="text-xs font-semibold text-taupe uppercase tracking-wide">
                                Shipping from {sellerName(group.sellerId)}
                              </p>
                            </div>
                            {renderRates(group.sellerId)}
                          </div>

                          {ready ? (
                            <button
                              type="button"
                              onClick={() => handleGroupCheckout(group.sellerId)}
                              disabled={processing || !groupReadyToCheckout(group.sellerId)}
                              className="btn btn-primary w-full py-3 disabled:opacity-50"
                            >
                              {processing && processingSeller === group.sellerId
                                ? 'Redirecting to Payment...'
                                : groupReadyToCheckout(group.sellerId)
                                  ? `Checkout with this seller — $${groupTotal(group).toFixed(2)}`
                                  : 'Choose a shipping option above'}
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
                      <>
                        {sellerGroups.length === 1 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-4 w-4 text-gold" />
                              <p className="text-xs font-semibold text-taupe uppercase tracking-wide">
                                Shipping Options
                              </p>
                            </div>
                            {renderRates(sellerGroups[0].sellerId)}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={
                            processing ||
                            (sellerGroups.length === 1 && !groupReadyToCheckout(sellerGroups[0].sellerId))
                          }
                          className="btn btn-primary w-full py-3.5 disabled:opacity-50"
                        >
                          {processing
                            ? 'Redirecting to Payment...'
                            : sellerGroups.length === 1 && groupReadyToCheckout(sellerGroups[0].sellerId)
                              ? `Place Order — $${groupTotal(sellerGroups[0]).toFixed(2)}`
                              : 'Place Order'}
                        </button>
                        {sellerGroups.length === 1 && groupErrors[sellerGroups[0].sellerId] && (
                          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                            {groupErrors[sellerGroups[0].sellerId]}
                          </div>
                        )}
                      </>
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
                        <ListingImage
                          src={(item.product as any).images[0]}
                          alt={(item.product as any).title}
                          className="w-16 h-16 rounded-lg flex-shrink-0"
                          sizes="64px"
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
                  {selectedRate(group.sellerId) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-taupe">
                        Shipping — {selectedRate(group.sellerId)!.carrier} {selectedRate(group.sellerId)!.serviceLevel}
                      </span>
                      <span className="text-charcoal">
                        ${selectedRate(group.sellerId)!.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
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
                {selectedShippingTotal > 0 ? (
                  <span className="text-charcoal">${selectedShippingTotal.toFixed(2)}</span>
                ) : (
                  <span className="text-taupe italic">Select options above</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-taupe">Tax</span>
                <span className="text-taupe">Calculated at checkout</span>
              </div>
            </div>
            <div className="flex justify-between text-xl font-bold pt-4 border-t border-blush">
              <span className="text-charcoal">Total</span>
              <span className="text-charcoal">${grandTotal.toFixed(2)}</span>
            </div>
            {isMultiSeller && (
              <p className="text-xs text-taupe mt-3">
                Checked out per seller — each seller&apos;s button shows their items plus the
                shipping option you picked for them.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
