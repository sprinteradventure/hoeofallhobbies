import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ============================================================================
// STRIPE CONNECT ONBOARDING — LIVE
// ----------------------------------------------------------------------------
// POST /api/connect/onboard
//   Seller-only. Creates a Stripe Express account for the seller on first use
//   (stored as user_profiles.stripe_account_id), then returns a Stripe-hosted
//   onboarding Account Link URL. Refresh/return both land on /seller/payouts,
//   which re-syncs status via GET below.
//
// GET /api/connect/onboard
//   Returns { hasAccount, onboardingComplete, payoutsEnabled } for the signed-
//   in seller. If the seller has a connected account, the flags are refreshed
//   from Stripe (accounts.retrieve) and the profile row is updated when the
//   stored values have drifted — the account.updated webhook is the primary
//   sync path, this is the belt-and-braces one for page loads.
//
// Auth: Authorization: Bearer <supabase access token> (same pattern as
// /api/reports). Never exposes the Stripe secret key or account details
// beyond the two status flags.
// ============================================================================

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'
const PAYOUTS_PAGE = `${APP_URL}/seller/payouts`

async function getAuthedProfile(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const admin = getSupabaseAdmin()
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, is_seller, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) }
  }

  return { admin, user, profile }
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return null
  return stripeSecretKey
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = getStripe()
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
      { status: 501 }
    )
  }

  try {
    const auth = await getAuthedProfile(request)
    if ('error' in auth && auth.error) return auth.error
    const { admin, user, profile } = auth as any

    if (!profile.is_seller) {
      return NextResponse.json(
        { error: 'Only sellers can set up payouts.' },
        { status: 403 }
      )
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)

    // --- Create the Express account on first onboarding --------------------
    let stripeAccountId: string = profile.stripe_account_id
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email ?? undefined,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { user_id: user.id },
      })
      stripeAccountId = account.id

      const { error: updateError } = await admin
        .from('user_profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', user.id)

      if (updateError) throw updateError
    }

    // --- Stripe-hosted onboarding link -------------------------------------
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: PAYOUTS_PAGE,
      return_url: PAYOUTS_PAGE,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Connect onboard error:', error)
    return NextResponse.json(
      { error: 'Could not start payout setup. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthedProfile(request)
    if ('error' in auth && auth.error) return auth.error
    const { admin, profile } = auth as any

    let onboardingComplete: boolean = profile.stripe_onboarding_complete
    let payoutsEnabled: boolean = profile.stripe_payouts_enabled

    // Sync the flags from Stripe when an account exists — covers the window
    // between the seller finishing onboarding and the account.updated webhook
    // arriving (and any webhook delivery hiccups).
    if (profile.stripe_account_id) {
      const stripeSecretKey = getStripe()
      if (stripeSecretKey) {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeSecretKey)
        const account = await stripe.accounts.retrieve(profile.stripe_account_id)

        onboardingComplete = !!account.details_submitted
        payoutsEnabled = !!(account.payouts_enabled && account.charges_enabled)

        if (
          onboardingComplete !== profile.stripe_onboarding_complete ||
          payoutsEnabled !== profile.stripe_payouts_enabled
        ) {
          await admin
            .from('user_profiles')
            .update({
              stripe_onboarding_complete: onboardingComplete,
              stripe_payouts_enabled: payoutsEnabled,
            })
            .eq('id', profile.id)
        }
      }
    }

    return NextResponse.json({
      hasAccount: !!profile.stripe_account_id,
      onboardingComplete,
      payoutsEnabled,
    })
  } catch (error) {
    console.error('Connect status error:', error)
    return NextResponse.json(
      { error: 'Could not load payout status. Please try again.' },
      { status: 500 }
    )
  }
}
