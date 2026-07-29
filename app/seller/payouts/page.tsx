'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Wallet, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { SELLER_KEEP_PERCENT } from '@/lib/categories'

type PayoutStatus = {
  hasAccount: boolean
  onboardingComplete: boolean
  payoutsEnabled: boolean
}

export default function SellerPayoutsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<PayoutStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
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

      if (res.status === 403) {
        router.push('/seller/dashboard')
        return
      }
      if (!res.ok) throw new Error(data?.error || 'Could not load payout status.')

      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payout status.')
    } finally {
      setLoading(false)
    }
  }

  async function startOnboarding() {
    setStarting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Could not start payout setup. Please try again.')
      }

      // Redirect to Stripe-hosted onboarding. Both the return and refresh
      // URLs land back on this page, which re-syncs status from Stripe.
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payout setup.')
      setStarting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const isActive = !!status?.payoutsEnabled
  const inProgress = !!status?.hasAccount && !isActive

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal">Payouts</h1>
        <p className="text-taupe font-lora mt-1">
          How you receive your {SELLER_KEEP_PERCENT}% of every sale
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-green-50' : inProgress ? 'bg-yellow-50' : 'bg-gold/10'
          }`}>
            {isActive ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : inProgress ? (
              <Clock className="h-6 w-6 text-yellow-600" />
            ) : (
              <Wallet className="h-6 w-6 text-gold" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-1">
              {isActive
                ? 'Active'
                : inProgress
                  ? 'Onboarding in progress'
                  : 'Not set up'}
            </h2>
            <p className="text-sm text-taupe mb-4">
              {isActive
                ? `Active — you'll receive ${SELLER_KEEP_PERCENT}% of each sale automatically, paid out to your connected bank account by Stripe.`
                : inProgress
                  ? "You've started setting up payouts but Stripe still needs a bit more information. Finish setup to start receiving automatic payouts."
                  : `Connect your bank account with Stripe to receive ${SELLER_KEEP_PERCENT}% of each sale automatically. Until setup is complete, buyers won't be able to purchase your items.`}
            </p>

            {!isActive && (
              <button
                onClick={startOnboarding}
                disabled={starting}
                className="btn btn-primary px-6 py-2.5"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {starting
                  ? 'Redirecting to Stripe...'
                  : inProgress
                    ? 'Continue setup'
                    : 'Set up payouts'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-ivory">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-sm text-taupe space-y-2">
            <p>
              <span className="font-semibold text-charcoal">How it works:</span> Hoe of All Hobbies
              uses Stripe Connect. When a buyer purchases your item, {SELLER_KEEP_PERCENT}% of the
              item price goes straight to your Stripe account and {100 - SELLER_KEEP_PERCENT}% stays with
              the platform. Shipping the buyer pays is retained by the platform to purchase your
              shipping label automatically. Stripe pays out to your bank on its standard schedule.
            </p>
            <p>
              Payout setup is handled securely by Stripe — we never see or store your bank details.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/seller/dashboard" className="text-sm text-gold hover:underline">
          ← Back to Seller Dashboard
        </Link>
      </div>
    </div>
  )
}
