import Link from 'next/link'
import { Search } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-purple-600 px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Your Marketplace for Craft & Hobby Supplies
          </h1>
          <p className="text-xl text-brand-100 mb-8">
            Buy and sell new, used, and rare hobby supplies. Support creators. Find treasures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop/products" className="btn-primary px-8 py-3 text-lg">
              Start Shopping
            </Link>
            <Link href="/seller/dashboard" className="btn-secondary px-8 py-3 text-lg">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-8">Find What You Love</h2>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              <input
                type="search"
                placeholder="Search supplies..."
                className="input w-full pl-10"
              />
            </div>
            <button className="btn-primary px-6">Search</button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-16 bg-neutral-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Knitting',
              'Painting',
              'Jewelry',
              'Woodworking',
              'Gardening',
              'Sewing'
            ].map((category) => (
              <Link
                key={category}
                href={`/shop/products?category=${category.toLowerCase()}`}
                className="card text-center hover:shadow-md transition-shadow"
              >
                <p className="font-semibold">{category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Safe & Secure', description: 'Secure payments and buyer protection' },
              { title: 'Verified Sellers', description: 'Trusted creators and hobbyists' },
              { title: 'Fair Pricing', description: 'Competitive prices from our community' }
            ].map((feature) => (
              <div key={feature.title} className="card text-center">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
