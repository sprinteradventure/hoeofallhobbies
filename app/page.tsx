import Link from 'next/link'
import { HoeMonogram, HoeWordmark, BotanicalDivider } from '@/components/BrandLogo'

export default function Home() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ivory via-blush to-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          {/* Brand Logo */}
          <div className="mb-8 flex justify-center">
            <HoeMonogram />
          </div>

          {/* Brand Wordmark */}
          <div className="mb-8">
            <HoeWordmark />
          </div>

          <BotanicalDivider />

          <p className="text-lg sm:text-xl text-taupe mb-12 max-w-2xl mx-auto font-lora leading-relaxed">
            Discover a curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators and collectors worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/categories" className="px-8 py-3 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all text-lg">
              Browse Collections
            </Link>
            <Link href="/sell" className="px-8 py-3 border-2 border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-white transition-all text-lg">
              Start Selling
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-5 text-gold opacity-10 text-6xl">🌿</div>
        <div className="absolute bottom-10 right-5 text-gold opacity-10 text-6xl">🌿</div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-cormorant text-4xl sm:text-5xl font-bold text-charcoal mb-2">
              Why Hoe of All Hobbies?
            </h2>
            <div className="h-1 w-16 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: '🌱 Sustainable',
                description: 'Give vintage and second-hand supplies a new home. Reduce waste, support sustainability.'
              },
              {
                title: '💎 Quality Finds',
                description: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.'
              },
              {
                title: '🤝 Community Driven',
                description: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.'
              },
              {
                title: '✨ Fair Pricing',
                description: 'Transparent pricing model: sellers keep 80%, we take 20% to keep the marketplace running.'
              },
              {
                title: '🔒 Secure Transactions',
                description: 'Stripe-powered payments with buyer and seller protection for peace of mind.'
              },
              {
                title: '📦 Easy Shipping',
                description: 'Integrated shipping labels and tracking for smooth transactions.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-ivory rounded-xl p-8 bor