'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'

export default function SellerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({ sales: 0, revenue: 0, products: 0, orders: 0 })
  const [loading, setLoading] = useState(true)

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

      // Get profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData?.is_seller) {
        // Enable seller mode
        await supabase.from('user_profiles').update({ is_seller: true }).eq('id', user.id)
      }

      setProfile(profileData)

      // Get stats
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id)
        .eq('is_active', true)

      const { data: orders } = await supabase
        .from('orders')
        .select('total_price, status')
        .eq('seller_id', user.id)

      const revenue = orders?.reduce((sum, order) => {
        return order.status === 'delivered' || order.status === 'completed'
          ? sum + order.total_price * 0.8
          : sum
      }, 0) || 0

      setStats({
        sales: orders?.length || 0,
        revenue,
        products: products?.length || 0,
        orders: orders?.length || 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Seller Dashboard</h1>
        <Link href="/seller/listings" className="btn-primary px-6 py-2">
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

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm">Total Sales</p>
              <p className="text-3xl font-bold">{stats.sales}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-brand-700 opacity-50" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm">Revenue</p>
              <p className="text-3xl font-bold">${stats.revenue.toFixed(0)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm">Active Listings</p>
              <p className="text-3xl font-bold">{stats.products}</p>
            </div>
            <Package className="h-10 w-10 text-blue-600 opacity-50" />
          </div>
        </div>
        <div className="card">
          <div>
            <p className="text-neutral-600 text-sm">Orders</p>
            <p className="text-3xl font-bold">{stats.orders}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/seller/listings/new" className="block btn-primary px-4 py-2 text-center">
              List New Product
            </Link>
            <Link href="/seller/orders" className="block btn-secondary px-4 py-2 text-center">
              View Orders
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Seller Info</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-neutral-600">Status:</span> {profile?.seller_verified ? 'Verified' : 'Pending'}</div>
            <div><span className="text-neutral-600">Rating:</span> {profile?.avg_rating || 'No ratings yet'}</div>
            <div><span className="text-neutral-600">Reviews:</span> {profile?.total_reviews || 0}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
