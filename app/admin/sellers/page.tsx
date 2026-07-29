'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ShieldAlert, BadgeCheck, Wallet } from 'lucide-react'

type Seller = {
  id: string
  email: string | null
  username: string | null
  full_name: string | null
  seller_verified: boolean
  verification_status: 'unverified' | 'pending' | 'verified'
  stripe_payouts_enabled: boolean | null
  total_sales: number
  avg_rating: number | null
  created_at: string
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadSellers()
  }, [])

  async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function loadSellers() {
    try {
      const token = await getToken()
      if (!token) {
        setUnauthorized(true)
        return
      }

      // Authorization is enforced server-side against the ADMIN_EMAILS env
      // allowlist — this client never sees the list.
      const res = await fetch('/api/admin/sellers', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403 || res.status === 401) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) throw new Error('Failed to load sellers')

      const { sellers } = await res.json()
      setSellers(sellers as Seller[])
    } catch (err) {
      console.error('Admin sellers error:', err)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  async function setVerified(seller: Seller, verified: boolean) {
    if (!verified) {
      const name = seller.username || seller.email || 'this seller'
      if (!confirm(`Revoke the verified badge for ${name}?`)) return
    }

    setActing(seller.id)
    setToast(null)

    try {
      const token = await getToken()
      if (!token) {
        setUnauthorized(true)
        return
      }

      const res = await fetch(`/api/admin/sellers/${seller.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verified }),
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

      setSellers((prev) =>
        prev.map((s) =>
          s.id === seller.id
            ? {
                ...s,
                seller_verified: data.seller.seller_verified,
                verification_status: data.seller.verification_status,
              }
            : s
        )
      )
      setToast(
        `${seller.username || seller.email || 'Seller'} ${verified ? 'verified' : 'unverified'}.`
      )
    } catch (err) {
      console.error('Verify seller error:', err)
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
          Sellers
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

      {sellers.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-taupe">No sellers yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-charcoal">
                      {seller.username || seller.full_name || 'Unnamed seller'}
                    </p>
                    {seller.seller_verified ? (
                      <span className="badge badge-green flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="badge badge-blush capitalize">
                        {seller.verification_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-taupe">
                    {seller.email || 'no email'} · {seller.total_sales || 0} sales
                    {seller.avg_rating ? ` · ${seller.avg_rating.toFixed(1)}★` : ''}
                  </p>
                  <p className="text-xs text-taupe mt-0.5 flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    {seller.stripe_payouts_enabled
                      ? 'Payouts active (auto-verified via Stripe KYC)'
                      : 'Payouts not set up'}
                  </p>
                </div>

                <button
                  onClick={() => setVerified(seller, !seller.seller_verified)}
                  disabled={acting === seller.id}
                  className={
                    seller.seller_verified
                      ? 'btn btn-ghost border border-blush px-4 py-2 text-sm'
                      : 'btn btn-primary px-4 py-2 text-sm'
                  }
                >
                  {acting === seller.id
                    ? 'Saving...'
                    : seller.seller_verified
                      ? 'Revoke verified'
                      : 'Grant verified'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
