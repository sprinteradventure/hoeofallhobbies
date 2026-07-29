'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Package, DollarSign, AlertCircle, ShoppingBag, Star, Users, Wallet, Truck, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { SELLER_KEEP_PERCENT } from '@/lib/categories'

export default function SellerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({ sales: 0, revenue: 0, products: 0, orders: 0, rating: 0 })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [payoutBannerDismissed, setPayoutBannerDismissed] = useState(false)
  const [shippingBannerDismissed, setShippingBannerDismissed] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData?.is_seller) {
        await supabase.from('user_profiles').update({ is_seller: true }).eq('id', user.id)
      }

      setProfile(profileData)

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id)
        .eq('is_active', true)

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, buyer_id')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      const revenue = orders?.reduce((sum, order) => {
        return order.status === 'delivered' || order.status === 'completed'
          ? sum + order.total_price * (SELLER_KEEP_PERCENT / 100)
          : sum
      }, 0) || 0

      const completedOrders = orders?.filter(o => o.status === 'delivered' || o.status === 'completed') || []

      setStats({
        sales: completedOrders.length,
        revenue,
        products: products?.length || 0,
        orders: orders?.length || 0,
        rating: profileData?.avg_rating || 0
      })

      setRecentOrders(orders?.slice(0, 5) || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const statusColors: Record<string, string> = {
    pending: 'badge-yellow',
    payment_pending: 'badge-yellow',
    paid: 'badge-blue',
    shipped: 'badge-purple',
    delivered: 'badge-green',
    completed: 'badge-green',
    cancelled: 'badge-gray',
    refunded: 'badge-red',
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-bold text-charcoal">Seller Dashboard</h1>
          <p className="text-taupe font-lora mt-1">You keep {SELLER_KEEP_PERCENT}% of every sale</p>
        </div>
        <Link href="/seller/listings" className="btn btn-primary px-6 py-2">
          Manage Listings
        </Link>
      </div>

      {!profile?.seller_verified && (
        <div className="mb-8 card bg-yellow-50 border-yellow-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900">Verification Pending</h3>
              <p className="text-sm text-yellow-800">Complete your seller verification to increase selling limits</p>
            </div>
          </div>
        </div>
      )}

      {!payoutBannerDismissed && profile && !profile.stripe_payouts_enabled && (
        <div className="mb-8 card bg-ivory border-gold/40 relative">
          <button
            onClick={() => setPayoutBannerDismissed(true)}
            className="absolute top-3 right-3 text-taupe hover:text-charcoal transition-colors"
            aria-label="Dismiss payout setup reminder"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3">
            <Wallet className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-charcoal">Set up payouts to get paid</h3>
              <p className="text-sm text-taupe mb-3">
                Connect your bank account with Stripe to receive {SELLER_KEEP_PERCENT}% of each sale
                automatically. Buyers can&apos;t purchase your items until payout setup is complete.
              </p>
              <Link href="/seller/payouts" className="btn btn-primary px-5 py-2 text-sm">
                Set up payouts
              </Link>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const shippingSetupDone = !!(
          profile?.ship_street1 && profile?.ship_city && profile?.ship_state && profile?.ship_zip
        )
        return !shippingBannerDismissed && profile && !shippingSetupDone ? (
          <div className="mb-8 card bg-ivory border-gold/40 relative">
            <button
              onClick={() => setShippingBannerDismissed(true)}
              className="absolute top-3 right-3 text-taupe hover:text-charcoal transition-colors"
              aria-label="Dismiss shipping setup reminder"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3">
              <Truck className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-charcoal">Complete your shipping setup</h3>
                <p className="text-sm text-taupe mb-3">
                  Add your ship-from address so buyers see real carrier rates at checkout and
                  labels can be generated automatically for paid orders.
                </p>
                <Link href="/seller/shipping" className="btn btn-primary px-5 py-2 text-sm">
                  Set up shipping
                </Link>
              </div>
            </div>
          </div>
        ) : null
      })()}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-taupe text-sm">Completed Sales</p>
              <p className="text-3xl font-bold text-charcoal">{stats.sales}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-gold" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-taupe text-sm">Revenue (after {100 - SELLER_KEEP_PERCENT}% fee)</p>
              <p className="text-3xl font-bold text-charcoal">${stats.revenue.toFixed(0)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-taupe text-sm">Active Listings</p>
              <p className="text-3xl font-bold text-charcoal">{stats.products}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-taupe text-sm">Rating</p>
              <p className="text-3xl font-bold text-charcoal">
                {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/seller/listings/new" className="btn btn-primary w-full py-2.5">
                <ShoppingBag className="h-4 w-4 mr-2" />
                List New Product
              </Link>
              <Link href="/seller/orders" className="btn btn-secondary w-full py-2.5">
                View Orders
              </Link>
              <Link href="/seller/payouts" className="btn btn-ghost w-full py-2.5 border border-blush">
                <Wallet className="h-4 w-4 mr-2" />
                Payouts
              </Link>
              <Link href="/seller/shipping" className="btn btn-ghost w-full py-2.5 border border-blush">
                <Truck className="h-4 w-4 mr-2" />
                Shipping
              </Link>
              <Link href="/seller/listings" className="btn btn-ghost w-full py-2.5 border border-blush">
                Manage Listings
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-4">Seller Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-taupe">Status</span>
                <span className={`font-semibold ${profile?.seller_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {profile?.seller_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-taupe">Rating</span>
                <span className="font-semibold text-charcoal">{profile?.avg_rating || 'No ratings'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-taupe">Reviews</span>
                <span className="font-semibold text-charcoal">{profile?.total_reviews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-taupe">Total Sales</span>
                <span className="font-semibold text-charcoal">{profile?.total_sales || 0}</span>
              </div>
            </div>
          </div>

          <div className="card bg-ivory">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2">Shipping Setup</h2>
            <p className="text-sm text-taupe mb-4">
              Set your ship-from address and default parcel so buyers get real carrier rates and
              labels generate automatically.
            </p>
            <Link href="/seller/shipping" className="btn btn-ghost w-full py-2 border border-blush text-sm">
              Manage Shipping Settings
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-4">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-taupe text-sm">No orders yet. Start listing products!</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-ivory hover:bg-blush/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'completed' || order.status === 'delivered' ? 'bg-green-500' :
                        order.status === 'pending' ? 'bg-yellow-500' :
                        order.status === 'shipped' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-semibold text-sm text-charcoal">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-taupe">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-charcoal">${order.total_price.toFixed(2)}</p>
                      <span className={`text-xs capitalize ${
                        order.status === 'completed' || order.status === 'delivered' ? 'text-green-600' :
                        order.status === 'pending' ? 'text-yellow-600' :
                        order.status === 'shipped' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
