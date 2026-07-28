'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ShieldAlert } from 'lucide-react'

type AdminStats = {
  totalRevenue: string
  totalOrders: number
  activeUsers: number
  sellerCount: number
  activeProducts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [openReports, setOpenReports] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUnauthorized(true)
        return
      }

      // Authorization is enforced server-side in /api/admin/stats against the
      // ADMIN_EMAILS env allowlist — this client never sees the list.
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 403 || res.status === 401) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) throw new Error('Failed to load admin stats')

      setStats(await res.json())

      // Best-effort open-report count for the Moderation Queue link.
      try {
        const reportsRes = await fetch('/api/admin/reports?status=open', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (reportsRes.ok) {
          const { reports } = await reportsRes.json()
          setOpenReports(reports.length)
        }
      } catch {
        // Non-fatal: the link still works without a count.
      }
    } catch (err) {
      console.error('Admin dashboard error:', err)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-cormorant text-2xl font-bold text-charcoal mb-2">
            Not authorized
          </h1>
          <p className="text-taupe text-sm mb-6">
            This area is restricted to site administrators. If you believe you
            should have access, please contact the site owner.
          </p>
          <Link href="/" className="btn btn-primary px-6 py-2">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <Link
          href="/admin/moderation"
          className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          Moderation Queue
          {openReports !== null && (
            <span className="badge badge-gold">{openReports} open</span>
          )}
        </Link>
      </div>

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
