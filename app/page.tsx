import Link from 'next/link'
import { ArrowRight, ShoppingBag, Sparkles, Shield, Users, Truck, PartyPopper, Globe, Gift } from 'lucide-react'
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ivory via-cream to-blush px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <div className={`mx-auto ${isHolidays ? 'max-w-md md:max-w-lg' : 'max-w-sm md:max-w-md'}`}>
              <img
                src={isHolidays ? '/images/holidays-logo.png' : '/images/logo-of-all.png'}
                alt={`${siteName} — ${siteDescription}`}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Thin gold rule beneath the artwork lockup */}
          <div className="mx-auto mb-6 h-px w-24 bg-gold"></div>

          <p className="text-lg sm:text-xl text-taupe mb-8 max-w-2xl mx-auto leading-relaxed font-lora">
            {isHolidays
              ? 'The curated marketplace for holiday decor and celebration supplies. Buy and sell decorations, party essentials, and festive finds for every tradition, culture, and occasion.'
              : 'The curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators worldwide.'}
          </p>

          <div className="mx-auto flex max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/shop/products" className="btn btn-primary w-full sm:w-auto px-10 py-4 text-lg font-cormorant tracking-wider">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Browse Shop
            </Link>
            <Link href="/seller/listings/new" className="btn btn-secondary w-full sm:w-auto px-10 py-4 text-lg font-cormorant tracking-wider">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Selling
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-taupe text-sm font-lora">
            {isHolidays ? (
              <>
                <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-gold" /> Cultural & Inclusive</span>
                <span className="flex items-center gap-2"><PartyPopper className="h-4 w-4 text-gold" /> Every Celebration</span>
                <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-gold" /> Handmade & Vintage</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-gold" /> Secure Payments</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Community Driven</span>
                <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Easy Shipping</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Category Explorer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
                className="group relative bg-ivory rounded-xl p-5 border border-blush hover:border-gold hover:shadow-md transition-all duration-300 text-center"
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
            <p className="text-taupe font-lora">Simple, sustainable, and community-first</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(isHolidays
              ? [
                  {
                    step: '1',
                    title: 'List Your Decor',
                    description: `Upload photos, set your price, and choose from ${categories.length}+ categories. No listing fees.`,
                    icon: '✨'
                  },
                  {
                    step: '2',
                    title: 'Connect & Sell',
                    description: 'Buyers discover your items through smart search and category browsing for every celebration.',
                    icon: '🤝'
                  },
                  {
                    step: '3',
                    title: 'Keep 95%',
                    description: 'We only take 5% to keep the marketplace running. You keep the rest.',
                    icon: '💰'
                  }
                ]
              : [
                  {
                    step: '1',
                    title: 'List Your Supplies',
                    description: `Upload photos, set your price, and choose from ${categories.length}+ categories. No listing fees.`,
                    icon: '✨'
                  },
                  {
                    step: '2',
                    title: 'Connect & Sell',
                    description: 'Buyers discover your items through smart search and category browsing.',
                    icon: '🤝'
                  },
                  {
                    step: '3',
                    title: 'Keep 95%',
                    description: 'We only take 5% to keep the marketplace running. You keep the rest.',
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
                  { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 95%, we take only 5% to keep the marketplace running.' },
                  { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
                  { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
                ]
              : [
                  { title: 'Sustainable', desc: 'Give vintage and second-hand supplies a new home. Reduce waste, support circular crafting.' },
                  { title: 'Quality Finds', desc: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.' },
                  { title: 'Community Driven', desc: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.' },
                  { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 95%, we take only 5% to keep the marketplace running.' },
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
              Explore Shop
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link href="/sell" className="btn btn-secondary px-8 py-3 text-lg font-cormorant tracking-wider">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
