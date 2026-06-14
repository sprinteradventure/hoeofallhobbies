import Link from 'next/link'
import { HoeMonogram, HoeWordmark, BotanicalDivider, RibbonDivider } from '@/components/BrandLogo'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="space-y-0">
      {/* Hero Section with Branding Kit */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ivory via-blush to-cream px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Branding Kit Hero Image */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-full max-w-lg">
              <Image
                src="/images/branding-kit.png"
                alt="Hoe of All Hobbies Branding"
                width={1024}
                height={1536}
                className="w-full h-auto max-h-[500px] object-contain object-top rounded-2xl shadow-lg"
                priority
              />
            </div>
          </div>

          <RibbonDivider />

          <p className="text-lg sm:text-xl text-taupe mb-12 max-w-2xl mx-auto leading-relaxed font-lora">
            Discover a curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators and collectors worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="px-8 py-3 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all text-lg font-cormorant tracking-wider">
              Browse Collections
            </Link>
            <Link href="/sell" className="px-8 py-3 border-2 border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-white transition-all text-lg font-cormorant tracking-wider">
              Start Selling
            </Link>
          </div>
        </div>

        {/* Decorative botanical elements */}
        <div className="absolute top-10 left-5 text-gold opacity-20">
          <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
              <path d="M 100 160 Q 95 130 100 100 Q 105 70 100 40" />
              <path d="M 95 140 Q 75 135 70 155" />
              <path d="M 90 110 Q 65 105 55 125" />
              <path d="M 92 80 Q 70 75 60 95" />
              <path d="M 95 50 Q 75 45 65 65" />
              <path d="M 105 140 Q 125 135 130 155" />
              <path d="M 110 110 Q 135 105 145 125" />
              <path d="M 108 80 Q 130 75 140 95" />
              <path d="M 105 50 Q 125 45 135 65" />
            </g>
          </svg>
        </div>
        <div className="absolute bottom-10 right-5 text-gold opacity-20">
          <svg width="60" height="60" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7">
              <path d="M 100 160 Q 95 130 100 100 Q 105 70 100 40" />
              <path d="M 95 140 Q 75 135 70 155" />
              <path d="M 90 110 Q 65 105 55 125" />
              <path d="M 92 80 Q 70 75 60 95" />
              <path d="M 95 50 Q 75 45 65 65" />
              <path d="M 105 140 Q 125 135 130 155" />
              <path d="M 110 110 Q 135 105 145 125" />
              <path d="M 108 80 Q 130 75 140 95" />
              <path d="M 105 50 Q 125 45 135 65" />
            </g>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-2 font-cormorant tracking-wide">
              Why Hoe of All Hobbies?
            </h2>
            <div className="h-1 w-16 bg-gold mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Sustainable',
                description: 'Give vintage and second-hand supplies a new home. Reduce waste, support sustainability.'
              },
              {
                title: 'Quality Finds',
                description: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.'
              },
              {
                title: 'Community Driven',
                description: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.'
              },
              {
                title: 'Fair Pricing',
                description: 'Transparent pricing model: sellers keep 80%, we take 20% to keep the marketplace running.'
              },
              {
                title: 'Secure Transactions',
                description: 'Stripe-powered payments with buyer and seller protection for peace of mind.'
              },
              {
                title: 'Easy Shipping',
                description: 'Integrated shipping labels and tracking for smooth transactions.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-ivory rounded-xl p-8 border border-blush hover:border-gold hover:shadow-lg transition-all duration-300">
                <h3 className="text-2xl font-bold text-charcoal mb-3 font-cormorant tracking-wide">
                  {item.title}
              
                </h3>
                <p className="text-taupe font-lora leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-ivory to-blush">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <Image
              src="/images/H.png"
              alt="Decorative ribbon"
              width={120}
              height={60}
              className="h-10 w-auto mx-auto object-contain opacity-60"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4 font-cormorant tracking-wide">
            Ready to Start?
          </h2>
          <p className="text-lg text-taupe mb-8 font-lora leading-relaxed">
            Join our community of passionate crafters and collectors. Whether you\'re looking to buy or sell, we\'ve got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="px-8 py-3 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all text-lg font-cormorant tracking-wider">
              Explore Shop
            </Link>
            <Link href="/sell" className="px-8 py-3 border-2 border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-white transition-all text-lg font-cormorant tracking-wider">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
