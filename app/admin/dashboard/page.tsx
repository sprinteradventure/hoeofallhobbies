'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get stats
      const { data: orders } = await supabase.from('orders').select('total_price, status')
      const { data: users } = await supabase.from('user_profiles').select('id, is_seller')
      const { data: products } = await supabase.from('products').select('id, is_active')

      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_price * 0.2, 0) || 0

      setStats({
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders: orders?.length || 0,
        activeUsers: users?.length || 0,
        sellerCount: users?.filter(u => u.is_seller).length || 0,
        activeProducts: products?.filter(p => p.is_active).length || 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!stats) return <div className="min-h-screen flex items-center justify-center">Access denied</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-neutral-600 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold">${stats.totalRevenue}</p>
        </div>
        <div className="card">
          <p className="text-neutral-600 text-sm">Total Orders</p>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="card">
          <p className="text-neutral-600 text-sm">Active Users</p>
          <p className="text-2xl font-bold">{stats.activeUsers}</p>
        </div>
        <div className="card">
          <p className="text-neutral-600 text-sm">Sellers</p>
          <p className="text-2xl font-bold">{stats.sellerCount}</p>
        </div>
        <div className="card">
          <p className="text-neutral-600 text-sm">Active Products</p>
          <p className="text-2xl font-bold">{stats.activeProducts}</p>
        </div>
      </div>
    </div>
  )
}
