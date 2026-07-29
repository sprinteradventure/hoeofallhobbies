'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import { Truck, Package, CheckCircle } from 'lucide-react'

export default function SellerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [labelBusy, setLabelBusy] = useState<string | null>(null)
  const [labelErrors, setLabelErrors] = useState<Record<string, string>>({})

  async function generateLabel(orderId: string) {
    setLabelBusy(orderId)
    setLabelErrors((prev) => ({ ...prev, [orderId]: '' }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Please sign in again.')

      const res = await fetch(`/api/orders/${orderId}/label`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // 502 carries the carrier's own message (e.g. missing billing
        // method on the Shippo account) — show it verbatim.
        throw new Error(data?.error || 'Label generation failed. Please try again.')
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                label_url: data.labelUrl ?? o.label_url,
                tracking_number: data.trackingNumber ?? o.tracking_number,
                tracking_url: data.trackingUrl ?? o.tracking_url,
              }
            : o
        )
      )
    } catch (err) {
      setLabelErrors((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : 'Label generation failed. Please try again.',
      }))
    } finally {
      setLabelBusy(null)
    }
  }

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
        .select('*, buyer:user_profiles!orders_buyer_id_fkey(username, full_name)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o))
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Failed to update order status')
    }
  }

  async function addTracking(orderId: string, trackingNumber: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber, status: 'shipped' })
        .eq('id', orderId)

      if (error) throw error
      setOrders(orders.map(o => o.id === orderId ? { ...o, tracking_number: trackingNumber, status: 'shipped' } : o))
    } catch (err) {
      console.error('Error adding tracking:', err)
      alert('Failed to add tracking')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending', icon: Package },
    payment_pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Awaiting Payment', icon: Package },
    paid: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Paid', icon: CheckCircle },
    shipped: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Shipped', icon: Truck },
    delivered: { color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered', icon: CheckCircle },
    completed: { color: 'text-green-600', bg: 'bg-green-50', label: 'Completed', icon: CheckCircle },
    cancelled: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Cancelled', icon: Package },
    refunded: { color: 'text-red-600', bg: 'bg-red-50', label: 'Refunded', icon: Package },
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">My Orders</h1>
      <p className="text-taupe font-lora mb-8">Manage orders and update shipping for your buyers</p>

      {orders.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-taupe" />
          </div>
          <p className="text-charcoal font-semibold mb-2">No orders yet</p>
          <p className="text-taupe text-sm">Orders will appear here when buyers purchase your listings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = status.icon
            const buyer = (order as any).buyer
            const [trackingInput, setTrackingInput] = useState('')
            const [showTrackingInput, setShowTrackingInput] = useState(false)

            return (
              <div key={order.id} className="card">
                <div className="grid lg:grid-cols-6 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Order</p>
                    <p className="font-mono text-sm text-charcoal">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Buyer</p>
                    <p className="text-sm text-charcoal">{buyer?.username || buyer?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Amount</p>
                    <p className="text-lg font-bold text-charcoal">${order.total_price.toFixed(2)}</p>
                    <p className="text-xs text-taupe">You keep 95%</p>
                  </div>
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Quantity</p>
                    <p className="text-charcoal">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-taupe uppercase tracking-wider">Date</p>
                    <p className="text-sm text-charcoal">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="border-t border-blush pt-4 mb-4">
                    <p className="text-xs text-taupe uppercase tracking-wider mb-1">Ship To</p>
                    <p className="text-sm text-charcoal">
                      {(order.shipping_address as any)?.fullName}, {(order.shipping_address as any)?.address}, {(order.shipping_address as any)?.city}, {(order.shipping_address as any)?.state} {(order.shipping_address as any)?.zip}
                    </p>
                  </div>
                )}

                {/* Shipping service + label */}
                {order.shipping_service_level && (
                  <div className="border-t border-blush pt-4 mb-4">
                    <p className="text-xs text-taupe uppercase tracking-wider mb-1">Shipping</p>
                    <p className="text-sm text-charcoal">
                      {order.shipping_service_level}
                      {order.shipping_cost != null && (
                        <span className="text-taupe"> — paid by buyer: ${Number(order.shipping_cost).toFixed(2)}</span>
                      )}
                    </p>
                    <div className="mt-2">
                      {order.label_url ? (
                        <a
                          href={order.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Print shipping label (PDF)
                        </a>
                      ) : order.status === 'paid' && order.shippo_rate_id ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => generateLabel(order.id)}
                            disabled={labelBusy === order.id}
                            className="btn btn-primary py-2 px-4 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                          >
                            <Truck className="h-4 w-4" />
                            {labelBusy === order.id ? 'Generating label...' : 'Generate shipping label'}
                          </button>
                          {labelErrors[order.id] && (
                            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              {labelErrors[order.id]}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Tracking */}
                {order.tracking_number && (
                  <div className="border-t border-blush pt-4 mb-4">
                    <p className="text-xs text-taupe uppercase tracking-wider mb-1">Tracking</p>
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-gold hover:underline"
                      >
                        {order.tracking_number}
                      </a>
                    ) : (
                      <p className="font-mono text-sm text-gold">{order.tracking_number}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'cancelled' && (
                  <div className="border-t border-blush pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-taupe">Update Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="input w-40 py-2"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                      </select>

                      {!order.tracking_number && (
                        <>
                          {!showTrackingInput ? (
                            <button
                              onClick={() => setShowTrackingInput(true)}
                              className="btn btn-ghost py-2 border border-blush text-sm"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Add Tracking
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Tracking #"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value)}
                                className="input w-40 py-2"
                              />
                              <button
                                onClick={() => {
                                  if (trackingInput.trim()) {
                                    addTracking(order.id, trackingInput.trim())
                                    setShowTrackingInput(false)
                                    setTrackingInput('')
                                  }
                                }}
                                className="btn btn-primary py-2 px-3 text-sm"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
