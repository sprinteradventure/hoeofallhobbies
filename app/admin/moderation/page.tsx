'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ShieldAlert, Flag, ChevronDown, ChevronUp } from 'lucide-react'

type Report = {
  id: string
  reporter_id: string
  product_id: string | null
  reported_user_id: string | null
  reason: string
  details: string | null
  status: 'open' | 'resolved' | 'dismissed'
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  product: {
    id: string
    title: string
    price: number
    is_active: boolean
    seller_id: string
  } | null
  reporter: { id: string; email: string | null; username: string | null }
  seller: { id: string; email: string | null; username: string | null } | null
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AdminModerationPage() {
  const [openReports, setOpenReports] = useState<Report[]>([])
  const [closedReports, setClosedReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function loadReports() {
    try {
      const token = await getToken()
      if (!token) {
        setUnauthorized(true)
        return
      }

      // Authorization is enforced server-side against the ADMIN_EMAILS env
      // allowlist — this client never sees the list.
      const res = await fetch('/api/admin/reports?status=all', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403 || res.status === 401) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) throw new Error('Failed to load reports')

      const { reports } = await res.json()
      setOpenReports((reports as Report[]).filter((r) => r.status === 'open'))
      setClosedReports((reports as Report[]).filter((r) => r.status !== 'open'))
    } catch (err) {
      console.error('Moderation queue error:', err)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(report: Report, action: string) {
    if (action === 'delete_listing') {
      if (!confirm('Permanently delete this listing? This cannot be undone.')) return
    }
    if (action === 'ban_seller') {
      const seller = report.seller?.username || report.seller?.email || 'this seller'
      if (!confirm(`Ban ${seller}? Their account will be blocked and ALL their listings deactivated.`)) return
    }

    setActing(report.id)
    setToast(null)

    try {
      const token = await getToken()
      if (!token) {
        setUnauthorized(true)
        return
      }

      const res = await fetch(`/api/admin/reports/${report.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          admin_note: adminNotes[report.id]?.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.status === 403 || res.status === 401) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) {
        setToast(data.error || 'Action failed.')
        return
      }

      const updated = data.report as Report
      // Remove from the open queue and surface in the resolved section.
      setOpenReports((prev) => prev.filter((r) => r.id !== report.id))
      setClosedReports((prev) => [{ ...report, ...updated, product: report.product, reporter: report.reporter, seller: report.seller }, ...prev])
      setToast(`Report ${updated.status}.`)
    } catch (err) {
      console.error('Moderation action error:', err)
      setToast('Action failed.')
    } finally {
      setActing(null)
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal">
          Moderation Queue
        </h1>
        <Link href="/admin/dashboard" className="btn btn-ghost border border-blush px-4 py-2 text-sm">
          Admin Dashboard
        </Link>
      </div>

      {toast && (
        <p className="text-sm text-charcoal bg-ivory border border-blush rounded-lg px-4 py-3 mb-6">
          {toast}
        </p>
      )}

      {openReports.length === 0 ? (
        <div className="card text-center py-10">
          <Flag className="h-8 w-8 text-gold mx-auto mb-3" />
          <p className="text-taupe">No open reports. The queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {openReports.map((report) => (
            <div key={report.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {report.product ? (
                      <Link
                        href={`/shop/products/${report.product.id}`}
                        className="font-cormorant text-xl font-bold text-charcoal hover:text-gold transition-colors"
                      >
                        {report.product.title}
                      </Link>
                    ) : (
                      <span className="font-cormorant text-xl font-bold text-taupe">
                        Listing deleted
                      </span>
                    )}
                    {report.product && (
                      <span className={report.product.is_active ? 'badge badge-green' : 'badge badge-red'}>
                        {report.product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  {report.product && (
                    <p className="text-lg font-bold text-gold">
                      ${report.product.price.toFixed(2)}
                    </p>
                  )}
                </div>
                <span className="badge badge-red">{report.reason}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                <p className="text-taupe">
                  Seller:{' '}
                  <span className="text-charcoal font-medium">
                    {report.seller?.username || report.seller?.email || 'Unknown'}
                  </span>
                  {report.seller?.username && report.seller?.email && (
                    <span className="text-taupe"> ({report.seller.email})</span>
                  )}
                </p>
                <p className="text-taupe">
                  Reported by:{' '}
                  <span className="text-charcoal font-medium">
                    {report.reporter.email || report.reporter.username || 'Unknown'}
                  </span>
                </p>
              </div>

              {report.details && (
                <p className="text-sm text-charcoal bg-ivory rounded-lg px-4 py-3 mb-4 whitespace-pre-wrap">
                  {report.details}
                </p>
              )}

              <p className="text-xs text-taupe mb-4">{timeAgo(report.created_at)}</p>

              <input
                type="text"
                value={adminNotes[report.id] ?? ''}
                onChange={(e) =>
                  setAdminNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
                placeholder="Admin note (optional)"
                className="input mb-4"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAction(report, 'deactivate_listing')}
                  disabled={acting === report.id || !report.product?.is_active}
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Deactivate listing
                </button>
                <button
                  onClick={() => handleAction(report, 'delete_listing')}
                  disabled={acting === report.id || !report.product}
                  className="btn px-4 py-2 text-sm bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700"
                >
                  Delete listing
                </button>
                <button
                  onClick={() => handleAction(report, 'ban_seller')}
                  disabled={acting === report.id || !report.seller}
                  className="btn px-4 py-2 text-sm bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700"
                >
                  Ban seller
                </button>
                <button
                  onClick={() => handleAction(report, 'dismiss')}
                  disabled={acting === report.id}
                  className="btn btn-ghost border border-blush px-4 py-2 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {closedReports.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="flex items-center gap-2 text-sm font-semibold text-taupe hover:text-gold transition-colors mb-4"
          >
            {showResolved ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Show resolved ({closedReports.length})
          </button>

          {showResolved && (
            <div className="space-y-3">
              {closedReports.map((report) => (
                <div key={report.id} className="card bg-ivory">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-charcoal">
                        {report.product?.title || 'Listing deleted'}
                      </p>
                      <p className="text-xs text-taupe">
                        {report.reason} · reported {timeAgo(report.created_at)}
                        {report.seller && ` · seller: ${report.seller.username || report.seller.email}`}
                      </p>
                      {report.admin_note && (
                        <p className="text-xs text-taupe mt-1">Note: {report.admin_note}</p>
                      )}
                    </div>
                    <span className={report.status === 'resolved' ? 'badge badge-green' : 'badge badge-blush'}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
