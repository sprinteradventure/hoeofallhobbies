'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store, Sparkles, Percent, BadgePercent, Megaphone, Pin, ShieldCheck,
  ArrowRight, Check, X, TrendingUp, Users, Wallet, Truck, ChevronDown,
} from 'lucide-react'
import { SELLER_KEEP_PERCENT } from '@/lib/categories'

// ============================================================================
// /sell — seller landing page.
//
// Previously this route was a bare redirect to login/listing-creation. It is
// now the public front door for makers setting up a shop: the pitch, the fee
// comparison, the setup steps, and the marketing toolkit. Logged-in sellers
// see CTAs pointing into their dashboard instead of the signup flow.
//
// Copy deliberately speaks about "big marketplaces" in the plural and never
// names or alludes to a specific competitor — no third-party marks, no
// disparagement, just our own terms.
// ============================================================================

export default function SellPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled) setLoggedIn(!!session)
      } catch {
        if (!cancelled) setLoggedIn(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  const startHref = loggedIn ? '/seller/dashboard' : '/auth/signup'
  const startLabel = loggedIn ? 'Go to your dashboard' : 'Open your shop — it\'s free'

  const comparison = [
    { label: 'Listing fees', us: 'None — list as much as you like', them: '$0.20 every listing, even unsold' },
    { label: 'Transaction fee', us: '2% flat, nothing hidden', them: '6.5% before other charges' },
    { label: 'Offsite ad commissions', us: 'Never — we don\'t tax your marketing', them: 'Up to 15% on orders you didn\'t ask to promote' },
    { label: 'Your shop\'s home', us: 'Your own storefront page to share anywhere', them: 'One row in an endless search result' },
    { label: 'Who you\'re talking to', us: 'Humans, with published policies', them: 'Algorithms and form letters' },
  ]

  const steps = [
    {
      icon: Store,
      title: 'Claim your shop',
      body: 'Pick a name and a web address. Your storefront goes live instantly — banner, story, announcement bar, social links.',
    },
    {
      icon: Sparkles,
      title: 'List your first items',
      body: 'Photos, price, category, done. No listing fees means you can move your whole catalog without it costing a cent.',
    },
    {
      icon: Wallet,
      title: 'Get paid directly',
      body: 'Connect your bank with Stripe in a few minutes. You keep ' + SELLER_KEEP_PERCENT + '% of every sale, transferred straight to you.',
    },
  ]

  const toolkit = [
    {
      icon: Megaphone,
      title: 'Your own storefront',
      body: 'A shareable page at hoeofallhobbies.com/shops/your-name — put it in your Instagram bio, your newsletter, anywhere.',
    },
    {
      icon: BadgePercent,
      title: 'Coupon codes',
      body: 'Issue discount codes for your shop and share them with your followers. You control the size, the cap, and the expiry.',
    },
    {
      icon: Pin,
      title: 'Pinterest-ready pins',
      body: 'Every listing gets a beautifully branded 2:3 pin image, generated automatically — the format Pinterest loves.',
    },
    {
      icon: Users,
      title: 'Direct buyer messages',
      body: 'Buyers message you in-house. No middleman reading along, no per-conversation toll booth.',
    },
  ]

  const faqs = [
    {
      q: 'What does it cost to sell?',
      a: `Nothing until you sell. There are no listing or monthly fees — we take ${100 - SELLER_KEEP_PERCENT}% of each completed sale to keep the marketplace running, and you keep ${SELLER_KEEP_PERCENT}%. Stripe's standard card processing fee applies at payout, same as anywhere.`,
    },
    {
      q: 'What can I sell?',
      a: 'Handmade goods, craft and hobby supplies, vintage finds, patterns, kits, and destash — new or pre-loved. Every category is curated, and prohibited items are published plainly in our policies, not discovered by surprise.',
    },
    {
      q: 'How do payouts work?',
      a: 'You connect your own Stripe account once. When a buyer pays, your share is transferred to you directly as part of the charge — the platform never holds your money.',
    },
    {
      q: 'Can I sell here and somewhere else at the same time?',
      a: 'Absolutely. There is no exclusivity clause anywhere in our terms. Your shop is yours; we just think you\'ll like it here better.',
    },
    {
      q: 'How do I move my listings over?',
      a: 'There\'s no listing fee, so the simplest migration is to re-list your catalog at your own pace — most sellers do a batch a day with coffee. Your storefront can be live with a single listing while you bring the rest across.',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ivory via-cream to-blush px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="badge badge-gold mb-6 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Independent sellers welcome
          </span>
          <h1 className="font-cormorant text-4xl sm:text-6xl font-bold text-charcoal mb-5 tracking-wide text-balance">
            Your craft deserves a shop<br className="hidden sm:block" /> of its own.
          </h1>
          <p className="text-lg sm:text-xl text-taupe mb-9 max-w-2xl mx-auto leading-relaxed font-lora">
            A marketplace built for makers, not margins. No listing fees, a flat 2% when you sell,
            your own storefront to share anywhere, and coupon tools to bring your people with you.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href={startHref} className="btn btn-primary px-10 py-4 text-lg font-cormorant tracking-wider">
              {checking ? 'Loading…' : startLabel}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary px-10 py-4 text-lg font-cormorant tracking-wider">
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-taupe font-lora">
            Free to join · No listing fees · No exclusivity · Cancel anytime
          </p>
        </div>
      </section>

      {/* Comparison band */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Straightforward, by design
            </h2>
            <p className="text-taupe font-lora max-w-xl mx-auto">
              Big marketplaces keep finding new edges to charge you on. We have exactly one line:
              {100 - SELLER_KEEP_PERCENT}% when you sell, and that&apos;s the whole fee schedule.
            </p>
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="grid grid-cols-2 bg-ivory border-b border-blush">
              <div className="px-5 py-4 font-cormorant font-bold text-charcoal tracking-wide">Here</div>
              <div className="px-5 py-4 font-cormorant font-bold text-taupe tracking-wide">The big marketplaces</div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-2 ${i > 0 ? 'border-t border-blush/60' : ''}`}
              >
                <div className="px-5 py-4">
                  <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1.5">{row.label}</p>
                  <p className="text-sm text-charcoal font-lora flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {row.us}
                  </p>
                </div>
                <div className="px-5 py-4 bg-cream/60">
                  <p className="text-xs uppercase tracking-wider text-taupe font-semibold mb-1.5 invisible sm:visible">{row.label}</p>
                  <p className="text-sm text-taupe font-lora flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {row.them}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-taupe mt-4 text-center font-lora">
            Fee figures for other platforms are their published standard rates and change without our involvement — ours won&apos;t.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Open today, selling this week
            </h2>
            <p className="text-taupe font-lora">Three steps between you and your own shop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="card text-center hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-gold" />
                </div>
                <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Step {i + 1}</div>
                <h3 className="font-cormorant text-xl font-bold text-charcoal mb-2">{step.title}</h3>
                <p className="text-taupe text-sm font-lora leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing toolkit */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-blush mb-4 inline-flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Built-in marketing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Your following comes with you
            </h2>
            <p className="text-taupe font-lora max-w-2xl mx-auto">
              On a giant marketplace you rent attention from an algorithm. Here you get tools to own
              your audience — a storefront worth sharing, codes worth redeeming, pins worth saving.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolkit.map((tool) => (
              <div key={tool.title} className="card hover:-translate-y-1">
                <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  <tool.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-cormorant text-lg font-bold text-charcoal mb-2">{tool.title}</h3>
                <p className="text-taupe text-sm font-lora leading-relaxed">{tool.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href={loggedIn ? '/seller/marketing' : '/auth/signup'} className="btn btn-secondary px-8 py-3 text-lg font-cormorant tracking-wider">
              Explore the marketing tools
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-gold" />
              <p className="font-cormorant font-bold text-charcoal text-lg">Stripe-secured payments</p>
              <p className="text-sm text-taupe font-lora">Direct payouts to your own account</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-7 w-7 text-gold" />
              <p className="font-cormorant font-bold text-charcoal text-lg">Real shipping rates</p>
              <p className="text-sm text-taupe font-lora">Live carrier quotes and printable labels</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-7 w-7 text-gold" />
              <p className="font-cormorant font-bold text-charcoal text-lg">You keep {SELLER_KEEP_PERCENT}%</p>
              <p className="text-sm text-taupe font-lora">One flat fee. That&apos;s the whole schedule.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Fair questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="card group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-cormorant text-lg font-bold text-charcoal">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 text-gold transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                </summary>
                <p className="text-taupe text-sm font-lora leading-relaxed mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-px w-24 bg-gold mx-auto mb-8"></div>
          <h2 className="text-3xl sm:text-5xl font-bold text-charcoal mb-4 font-cormorant tracking-wide">
            Your shop is waiting
          </h2>
          <p className="text-lg text-taupe mb-8 font-lora leading-relaxed">
            Join a marketplace that treats sellers like the reason it exists — because you are.
          </p>
          <Link href={startHref} className="btn btn-primary px-10 py-4 text-lg font-cormorant tracking-wider">
            <Store className="h-5 w-5 mr-2" />
            {loggedIn ? 'Go to your dashboard' : 'Open your free shop'}
          </Link>
          <p className="mt-5 text-sm text-taupe font-lora">
            No credit card · No listing fees · No exclusivity
          </p>
        </div>
      </section>
    </div>
  )
}
