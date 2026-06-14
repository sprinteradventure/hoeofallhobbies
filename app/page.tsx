import Link from 'next/link'
import { HoeWordmark, BotanicalDivider } from '@/components/BrandLogo'
import { CATEGORIES, getCategoryNames } from '@/lib/categories'
import { ArrowRight, Search, ShoppingBag, Sparkles, Users, Shield, Truck } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ivory via-cream to-blush px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="mx-auto max-w-sm md:max-w-md">
              <img
                src="/images/logo-of-all.png"
                alt="of all — decorative logo artwork"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <HoeWordmark />

          <BotanicalDivider />

          <p className="text-lg sm:text-xl text-taupe mb-10 max-w-2xl mx-auto leading-relaxed font-lora">
            The curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop/products" className="btn btn-primary px-8 py-3.5 text-lg font-cormorant tracking-wider">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Browse Shop
            </Link>
            <Link href="/seller/listings/new" className="btn btn-secondary px-8 py-3.5 text-lg font-cormorant tracking-wider">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Selling
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-taupe text-sm font-lora">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-gold" /> Secure Payments</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Community Driven</span>
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Easy Shipping</span>
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
              Discover supplies across {CATEGORIES.length} curated categories — from fabric to 3D printing, vintage finds to party supplies
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
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
            {[
              {
                step: '1',
                title: 'List Your Supplies',
                description: 'Upload photos, set your price, and choose from 23+ categories. No listing fees.',
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
            ].map((item) => (
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
              Built for Crafters
            </h2>
            <div className="h-1 w-16 bg-gold mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Sustainable', desc: 'Give vintage and second-hand supplies a new home. Reduce waste, support circular crafting.' },
              { title: 'Quality Finds', desc: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.' },
              { title: 'Community Driven', desc: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.' },
              { title: 'Fair Pricing', desc: `Transparent pricing: sellers keep 95%, we take only 5% to keep the marketplace running.` },
              { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
              { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
            ].map((item, index) => (
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
            Join our community of passionate crafters and collectors. Whether you&apos;re looking to buy or sell, we&apos;ve got you covered.
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
