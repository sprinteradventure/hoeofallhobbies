'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Order } from '@/lib/types'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
    refunded: 'bg-red-100 text-red-700',
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-neutral-600 mb-4">You haven't placed any orders yet</p>
          <Link href="/shop/products" className="btn-primary px-6 py-2">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="grid lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-sm text-neutral-600">Order ID</p>
                  <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total</p>
                  <p className="text-lg font-bold">${order.total_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Items</p>
                  <p>{order.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Date</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Tracking */}
              {order.tracking_number && (
                <div className="border-t pt-4">
                  <p className="text-sm text-neutral-600">Tracking Number</p>
                  <p className="font-mono">{order.tracking_number}</p>
                </div>
              )}

              {/* Actions */}
              {order.status === 'delivered' && (
                <div className="border-t pt-4 mt-4">
                  <Link href={`/shop/orders/${order.id}/review`} className="btn-secondary px-4 py-2">
                    Leave Review
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
