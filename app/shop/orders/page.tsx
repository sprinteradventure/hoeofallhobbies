'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import { Package, Truck, Star, ChevronRight, Download, AlertCircle } from 'lucide-react'
import ListingImage from '@/components/shop/ListingImage'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // Ids of digital (instant-download) products among these orders. Probed
  // separately so a pre-migration database (no product_type column) degrades
  // to "all physical" instead of failing the whole orders query.
  const [digitalIds, setDigitalIds] = useState<Set<string>>(new Set())
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState('')

  // product_ids per order that the buyer can download (digital + paid). Built
  // from order_items with a fallback to the legacy orders.product_id column.
  const [downloadableByOrder, setDownloadableByOrder] = useState<Record<string, string[]>>({})

  const DOWNLOADABLE_STATUSES = ['paid', 'shipped', 'delivered', 'completed']

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

      // Map each paid order to the full list of products it contains (for
      // download buttons on multi-item orders). order_items read may be
      // denied by RLS — then fall back to the legacy first-product column.
      let downloadableMap: Record<string, string[]> = {}
      try {
        const paidOrderIds = (data || [])
          .filter((o: any) => DOWNLOADABLE_STATUSES.includes(o.status))
          .map((o: any) => o.id) as string[]
        if (paidOrderIds.length > 0) {
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('order_id, product_id')
            .in('order_id', paidOrderIds)
          for (const row of orderItems || []) {
            const r = row as any
            if (!downloadableMap[r.order_id]) downloadableMap[r.order_id] = []
            downloadableMap[r.order_id].push(r.product_id)
          }
        }
      } catch {
        for (const o of data || []) {
          if ((o as any).product_id) downloadableMap[(o as any).id] = [(o as any).product_id]
        }
      }
      setDownloadableByOrder(downloadableMap)

      // Probe product_type for every product in these orders (separate query —
      // the embedded select above stays valid even before migration 020 runs).
      try {
        const fromOrders = (data || []).map((o: any) => o.product_id)
        const fromItems = Object.values(downloadableMap).flat()
        const productIds = Array.from(
          new Set([...fromOrders, ...fromItems].filter(Boolean))
        ) as string[]
        if (productIds.length > 0) {
          const { data: typeRows } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds)
          if (typeRows) {
            setDigitalIds(
              new Set(
                (typeRows as any[])
                  .filter((r) => r.product_type === 'digital')
                  .map((r) => r.id)
              )
            )
          }
        }
      } catch {
        // Column missing — everything is physical.
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch the verified download from /api/downloads (it checks the paid order
  // server-side and hands back the private file), then save it via a blob URL.
  async function handleDownload(productId: string) {
    setDownloadingId(productId)
    setDownloadError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Please sign in again to download your purchase.')

      const res = await fetch(`/api/downloads/${productId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Download failed. Please try again.')
      }

      // The route redirects to a signed storage URL; fetch followed it, so the
      // response IS the file. Recover the filename from Content-Disposition.
      let filename = 'download'
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match) filename = match[1]

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const statusConfig: Record<string, { color: string, bg: string, label: string }> = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
    payment_pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Awaiting Payment' },
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

      {downloadError && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {downloadError}
        </div>
      )}

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
                      <ListingImage
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full"
                        sizes="(max-width: 768px) 100vw, 128px"
                      />
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
                    {(downloadableByOrder[order.id] || [order.product_id])
                      .filter((pid: string) => pid && digitalIds.has(pid))
                      .map((pid: string) => (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => handleDownload(pid)}
                          disabled={downloadingId === pid}
                          className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {downloadingId === pid ? 'Preparing…' : 'Download Files'}
                        </button>
                      ))}
                    {order.status === 'shipped' && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Truck className="h-4 w-4" />
                        <span>On the way</span>
                      </div>
                    )}
                    {order.shipping_service_level && (
                      <div className="text-xs text-taupe">
                        Ships via: <span className="text-charcoal">{order.shipping_service_level}</span>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="text-xs text-taupe">
                        Tracking:{' '}
                        {order.tracking_url ? (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-gold hover:underline"
                          >
                            {order.tracking_number}
                          </a>
                        ) : (
                          <span className="font-mono">{order.tracking_number}</span>
                        )}
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
