'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import { Package, Truck, Star, ChevronRight } from 'lucide-react'

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
        .select('*, product:products(title, images, category)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const statusConfig: Record<string, { color: string, bg: string, label: string }> = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
    paid: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Paid' },
    shipped: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Shipped' },
    delivered: { color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
    completed: { color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    cancelled: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled' },
    refunded: { color: 'text-red-600', bg: 'bg-red-50', label: 'Refunded' },
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-taupe" />
          </div>
          <p className="text-charcoal font-semibold mb-2">No orders yet</p>
          <p className="text-taupe text-sm mb-6">Start shopping to place your first order</p>
          <Link href="/shop/products" className="btn btn-primary px-6 py-2">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = statusConfig[order.status] || statusConfig.pending
            const product = order.product as any
            
            return (
              <div key={order.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Product Image */}
                  <div className="w-full md:w-32 h-32 rounded-xl bg-ivory overflow-hidden flex-shrink-0">
                    {product?.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-taupe" />
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`badge ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-taupe">Order #{order.id.slice(0, 8)}</span>
                    </div>

                    <h3 className="font-cormorant text-lg font-bold text-charcoal mb-1">
                      {product?.title || 'Product'}
                    </h3>
                    <p className="text-sm text-taupe mb-3">{product?.category}</p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <span className="text-taupe">Total: </span>
                        <span className="font-bold text-charcoal">${order.total_price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-taupe">Qty: </span>
                        <span className="text-charcoal">{order.quantity}</span>
                      </div>
                      <div>
                        <span className="text-taupe">Date: </span>
                        <span className="text-charcoal">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:items-end">
                    {order.status === 'shipped' && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Truck className="h-4 w-4" />
                        <span>On the way</span>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="text-xs text-taupe">
                        Tracking: <span className="font-mono">{order.tracking_number}</span>
                      </div>
                    )}
                    {order.status === 'delivered' && (
                      <Link 
                        href={`/shop/orders/${order.id}/review`}
                        className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Leave Review
                      </Link>
                    )}
                    <Link 
                      href={`/shop/products/${order.product_id}`}
                      className="text-sm text-gold hover:underline flex items-center gap-1"
                    >
                      View Product <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
