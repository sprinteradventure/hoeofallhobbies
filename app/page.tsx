import Link from 'next/link'
import {
  ArrowRight, ShoppingBag, Sparkles, Shield, Users, Truck,
  Store, Zap, Sparkle, BadgePercent, Package, Wallet,
} from 'lucide-react'
import { getSiteCategories } from '@/lib/site-context-server'
import { getSiteName, getSiteUrl, getSiteDescription } from '@/lib/site-context-server'

export default async function Home() {
  const siteName = await getSiteName()
  const siteUrl = await getSiteUrl()
  const siteDescription = await getSiteDescription()
  const categories = await getSiteCategories()
  const isHolidays = siteName === 'Hoe of All Holidays'

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/images/${isHolidays ? 'holidays-logo.png' : 'logo-of-all.png'}`,
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
  }

  return (
    <div className="space-y-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero — says what the site is, in plain words, immediately */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ivory via-cream to-blush px-4 pt-10 pb-14 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-6xl text-center">
          {/* Brand mark, deliberately smaller — the words below do the explaining */}
          <div className="mb-6 flex justify-center">
            <div className={`${isHolidays ? 'w-36 md:w-44' : 'w-28 md:w-36'}`}>
              <img
                src={isHolidays ? '/images/holidays-logo.png' : '/images/logo-of-all.png'}
                alt={siteName}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-charcoal">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {isHolidays ? 'The marketplace for every celebration' : 'The marketplace for makers & collectors'}
          </div>

          <h1 className="mx-auto max-w-4xl font-cormorant text-4xl font-bold leading-tight text-charcoal sm:text-5xl md:text-6xl text-balance">
            {isHolidays
              ? <>Buy &amp; sell holiday decor, party supplies, and <span className="text-gold">digital templates</span>.</>
              : <>Buy &amp; sell craft supplies, handmade finds, and <span className="text-gold">digital templates</span>.</>}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg sm:text-xl leading-relaxed text-taupe font-lora">
            {isHolidays
              ? 'A curated marketplace built for sellers: your own free storefront, live shipping rates, instant-download listings — and you keep 98% of every sale.'
              : 'A curated marketplace built for sellers: your own free storefront, live shipping rates, instant-download listings — and you keep 98% of every sale.'}
          </p>

          {/* Three unambiguous actions */}
          <div className="mx-auto mt-9 flex max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/shop/products" className="btn btn-primary flex-1 px-8 py-4 text-lg font-cormorant tracking-wider sm:flex-none">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Shop the marketplace
            </Link>
            <Link href="/sell" className="btn flex-1 items-center justify-center px-8 py-4 text-lg font-cormorant tracking-wider bg-gold text-white hover:bg-opacity-90 sm:flex-none inline-flex">
              <Store className="h-5 w-5 mr-2" />
              Open your free shop
            </Link>
            <Link href="/sell" className="btn btn-secondary flex-1 px-8 py-4 text-lg font-cormorant tracking-wider sm:flex-none">
              <Zap className="h-5 w-5 mr-2" />
              Sell digital templates
            </Link>
          </div>

          {/* The five things that make us different — stated, not implied */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: BadgePercent, label: 'You keep 98%', href: '/sell' },
              { icon: Wallet, label: 'No listing fees', href: '/sell' },
              { icon: Store, label: 'Free storefront', href: '/seller/shop' },
              { icon: Zap, label: 'Instant digital delivery', href: '/sell' },
              { icon: Sparkle, label: 'AI-free browsing, your choice', href: '/shop/products' },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="flex items-center gap-2 rounded-xl border border-blush bg-white/80 px-3 py-2.5 text-xs font-semibold text-charcoal transition-all hover:border-gold hover:shadow-sm"
              >
                <chip.icon className="h-4 w-4 shrink-0 text-gold" />
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sell your way — physical or digital, spelled out */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Sell it your way
            </h2>
            <p className="text-taupe font-lora max-w-xl mx-auto">
              Whether you ship boxes or upload files, your shop handles both — in one place, on one dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Physical */}
            <div className="card hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Package className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-cormorant text-2xl font-bold text-charcoal mb-2">Physical items</h3>
              <p className="text-sm text-taupe font-lora leading-relaxed mb-4">
                List supplies, vintage finds, and handmade goods. Buyers see real carrier rates at
                checkout, labels generate automatically, and tracking syncs to the order.
              </p>
              <ul className="space-y-2 text-sm text-charcoal font-lora">
                <li className="flex items-start gap-2"><Truck className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> Live UPS, USPS &amp; FedEx rates</li>
                <li className="flex items-start gap-2"><Shield className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> One-click printable shipping labels</li>
                <li className="flex items-start gap-2"><Users className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> Direct buyer messaging</li>
              </ul>
            </div>

            {/* Digital */}
            <div className="card hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Zap className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-cormorant text-2xl font-bold text-charcoal mb-2">Digital templates</h3>
              <p className="text-sm text-taupe font-lora leading-relaxed mb-4">
                Upload a PDF, ZIP, or image template once and sell it forever. Buyers download
                instantly after paying — no shipping, no fulfillment, delivered automatically.
              </p>
              <ul className="space-y-2 text-sm text-charcoal font-lora">
                <li className="flex items-start gap-2"><Zap className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> Instant delivery, orders auto-complete</li>
                <li className="flex items-start gap-2"><Shield className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> Files stored privately — buyers only, verified</li>
                <li className="flex items-start gap-2"><Sparkle className="h-4 w-4 mt-0.5 shrink-0 text-gold" /> AI-content labels keep listings transparent</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Category Explorer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              Explore Categories
            </h2>
            <p className="text-taupe font-lora max-w-xl mx-auto">
              {isHolidays
                ? `Discover supplies across ${categories.length} curated categories — from Christmas to Diwali, weddings to quinceañeras`
                : `Discover supplies across ${categories.length} curated categories — from fabric to 3D printing, vintage finds to estate sales`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop/products?category=${encodeURIComponent(cat.name)}`}
                className="group relative bg-white rounded-xl p-5 border border-blush hover:border-gold hover:shadow-md transition-all duration-300 text-center"
              >
                <h3 className="font-cormorant text-base font-bold text-charcoal group-hover:text-gold transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="text-xs text-taupe mt-1 font-lora">{cat.subcategories.length} subcategories</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              How It Works
            </h2>
            <p className="text-taupe font-lora">From listing to payday in three steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(isHolidays
              ? [
                  {
                    step: '1',
                    title: 'Open your free shop',
                    description: `Set up Shop, upload photos, set your price, and choose from ${categories.length}+ categories. No listing fees, ever.`,
                    icon: '✨'
                  },
                  {
                    step: '2',
                    title: 'Buyers find you',
                    description: 'Smart search, category browsing, Pinterest-ready pins, and coupon codes you can share with your followers.',
                    icon: '🤝'
                  },
                  {
                    step: '3',
                    title: 'Keep 98%',
                    description: 'We only take 2% when you actually sell. Payouts go straight to your bank via Stripe.',
                    icon: '💰'
                  }
                ]
              : [
                  {
                    step: '1',
                    title: 'Open your free shop',
                    description: `Set up Shop, upload photos, set your price, and choose from ${categories.length}+ categories. No listing fees, ever.`,
                    icon: '✨'
                  },
                  {
                    step: '2',
                    title: 'Buyers find you',
                    description: 'Smart search, category browsing, Pinterest-ready pins, and coupon codes you can share with your followers.',
                    icon: '🤝'
                  },
                  {
                    step: '3',
                    title: 'Keep 98%',
                    description: 'We only take 2% when you actually sell. Payouts go straight to your bank via Stripe.',
                    icon: '💰'
                  }
                ]
            ).map((item) => (
              <div key={item.step} className="card text-center hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Step {item.step}</div>
                <h3 className="font-cormorant text-xl font-bold text-charcoal mb-2">{item.title}</h3>
                <p className="text-taupe text-sm font-lora leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Sellers band */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-charcoal text-cream">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge badge-gold mb-4 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                For sellers
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 font-cormorant tracking-wide text-balance">
                A shop of your own, without the rent.
              </h2>
              <p className="text-cream/80 font-lora leading-relaxed mb-8">
                {isHolidays
                  ? 'Open a storefront for your decor and celebration creations — physical or digital. No listing fees, a flat 2% only when you sell, and built-in tools to bring your followers with you.'
                  : 'Open a storefront for your craft and hobby finds — physical or digital. No listing fees, a flat 2% only when you sell, and built-in tools to bring your followers with you.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sell" className="btn px-8 py-3.5 text-lg font-cormorant tracking-wider bg-gold text-white border border-gold hover:bg-opacity-90 hover:-translate-y-0.5 inline-flex items-center justify-center">
                  Open your shop
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
                <Link href="/seller/shop" className="btn px-8 py-3.5 text-lg font-cormorant tracking-wider border border-cream/40 text-cream hover:bg-cream/10 inline-flex items-center justify-center">
                  See a shopfront
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Your own storefront', desc: 'A shareable page at /shops/your-name — banner, story, announcement bar, social links.' },
                { title: 'Digital templates', desc: 'Upload once, sell forever. Instant delivery with verified, private file downloads.' },
                { title: 'Coupon codes', desc: 'Issue discount codes for your shop and share them with your audience.' },
                { title: 'Pinterest-ready pins', desc: 'Every listing gets a branded 2:3 pin image, generated automatically.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-cream/15 bg-cream/5 p-5 hover:bg-cream/10 transition-colors">
                  <h3 className="font-cormorant text-lg font-bold mb-1.5">{item.title}</h3>
                  <p className="text-cream/70 text-sm font-lora leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
              {isHolidays ? 'Built for Celebrations' : 'Built for Crafters'}
            </h2>
            <div className="h-1 w-16 bg-gold mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isHolidays
              ? [
                  { title: 'Cultural & Inclusive', desc: 'Find decor and supplies for holidays from every culture, religion, and tradition — all in one place.' },
                  { title: 'Seasonal Finds', desc: 'Discover rare, vintage, and handmade decorations you won\'t find in big-box stores.' },
                  { title: 'Community Driven', desc: 'Connect with fellow hosts, DIY decorators, and party planners worldwide.' },
                  { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 98%, we take only 2% to keep the marketplace running.' },
                  { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
                  { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
                ]
              : [
                  { title: 'Sustainable', desc: 'Give vintage and second-hand supplies a new home. Reduce waste, support circular crafting.' },
                  { title: 'Quality Finds', desc: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.' },
                  { title: 'Community Driven', desc: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.' },
                  { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 98%, we take only 2% to keep the marketplace running.' },
                  { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
                  { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
                ]
            ).map((item, index) => (
              <div key={index} className="card hover:-translate-y-1">
                <h3 className="font-cormorant text-xl font-bold text-charcoal mb-2 tracking-wide">{item.title}</h3>
                <p className="text-taupe text-sm font-lora leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-px w-24 bg-gold mx-auto mb-8"></div>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4 font-cormorant tracking-wide">
            Ready to Start?
          </h2>
          <p className="text-lg text-taupe mb-8 font-lora leading-relaxed">
            {isHolidays
              ? 'Join our community of hosts, decorators, and party planners. Whether you\'re looking to buy or sell, we\'ve got every celebration covered.'
              : 'Join our community of passionate crafters and collectors. Whether you\'re looking to buy or sell, we\'ve got you covered.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop/products" className="btn btn-primary px-8 py-3 text-lg font-cormorant tracking-wider">
              Shop the marketplace
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link href="/sell" className="btn btn-secondary px-8 py-3 text-lg font-cormorant tracking-wider">
              Open your free shop
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
