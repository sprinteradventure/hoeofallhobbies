'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Edit, Plus, Package, Eye, AlertTriangle, Wallet, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import ListingImage from '@/components/shop/ListingImage'

type PayoutStatus = {
  hasAccount: boolean
  onboardingComplete: boolean
  payoutsEnabled: boolean
}

export default function SellerListingsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // ── Payout status check ──────────────────────────────────────────────────
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null)
  const [checkingPayouts, setCheckingPayouts] = useState(true)

  useEffect(() => {
    async function init() {
      await Promise.all([loadListings(), checkPayoutStatus()])
    }
    init()
  }, [])

  async function loadListings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('listing_date', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function checkPayoutStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/connect/onboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setPayoutStatus(data)
      }
    } catch (err) {
      console.error('Failed to check payout status:', err)
    } finally {
      setCheckingPayouts(false)
    }
  }

  const payoutsReady = payoutStatus?.payoutsEnabled === true

  async function toggleActive(id: string, current: boolean) {
    // Block activating if payouts aren't ready
    if (!current && !payoutsReady) {
      alert(
        'You must complete your payout setup before reactivating this listing.\n\n' +
        'Go to Seller Console → Payouts to connect your bank account.'
      )
      return
    }

    try {
      const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
      if (error) throw error
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !current } : p))
    } catch (err) {
      console.error('Error toggling product:', err)
      alert('Failed to update listing')
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete listing')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-bold text-charcoal">My Listings</h1>
          <p className="text-taupe font-lora mt-1">Manage your products across all categories</p>
        </div>
        <Link
          href="/seller/listings/new"
          className={`btn px-6 py-2.5 flex items-center gap-2 ${
            !payoutsReady && !checkingPayouts
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'btn btn-primary'
          }`}
          onClick={(e) => {
            if (!payoutsReady && !checkingPayouts) {
              e.preventDefault()
              alert(
                'You must complete your payout setup before creating a new listing.\n\n' +
                'Go to Seller Console → Payouts to connect your bank account.'
              )
            }
          }}
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PAYOUT SETUP WARNING — shown when payouts are NOT ready
          ═══════════════════════════════════════════════════════════════════════ */}
      {!checkingPayouts && !payoutsReady && (
        <div className="mb-8 rounded-xl border-2 border-yellow-400 bg-yellow-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-cormorant text-xl font-bold text-yellow-900 mb-2">
                Payout Setup Required to Sell
              </h3>
              <p className="text-sm text-yellow-800 mb-1 leading-relaxed">
                <strong>Your listings are hidden from buyers until you set up payouts.</strong>
                {' '}Connect your bank account with Stripe to start receiving payments.
              </p>
              <p className="text-sm text-yellow-700 mb-4 leading-relaxed">
                Go to your <strong>Seller Console → Payouts</strong> and complete the Stripe onboarding.
                It takes about 2 minutes.
              </p>
              <Link
                href="/seller/payouts"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                <Wallet className="h-4 w-4" />
                Go to Seller Console — Set Up Payouts
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-taupe" />
          </div>
          <p className="text-charcoal font-semibold mb-2">No listings yet</p>
          <p className="text-taupe text-sm mb-6">Create your first listing to start selling</p>
          <Link
            href="/seller/listings/new"
            className={`btn px-6 py-2 ${
              !payoutsReady && !checkingPayouts
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'btn btn-primary'
            }`}
            onClick={(e) => {
              if (!payoutsReady && !checkingPayouts) {
                e.preventDefault()
                alert(
                  'You must complete your payout setup before creating a listing.\n\n' +
                  'Go to Seller Console → Payouts to connect your bank account.'
                )
              }
            }}
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="card flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-ivory overflow-hidden flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <ListingImage
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-taupe" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-cormorant text-lg font-bold text-charcoal truncate">{product.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                  <span className="badge badge-gold">{product.category}</span>
                  <span className="text-taupe">${product.price.toFixed(2)}</span>
                  <span className="text-taupe">Stock: {product.quantity}</span>
                  <span className="text-taupe">Views: {product.views_count}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(product.id, product.is_active)}
                  title={
                    !payoutsReady && !product.is_active
                      ? 'Complete payout setup to reactivate'
                      : product.is_active ? 'Deactivate' : 'Activate'
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    product.is_active
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : !payoutsReady && !checkingPayouts
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                  {!payoutsReady && !product.is_active && !checkingPayouts && (
                    <span className="ml-1 text-[10px]">(payouts needed)</span>
                  )}
                </button>
                <Link
                  href={`/shop/products/${product.id}`}
                  className="btn btn-ghost p-2 border border-blush"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/seller/listings/${product.id}/edit`}
                  className="btn btn-ghost p-2 border border-blush"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="btn btn-ghost p-2 border border-blush hover:bg-red-50 hover:border-red-200"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
