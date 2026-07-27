import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Browse Categories - Hoe of All Hobbies',
  description: 'Explore all craft and hobby supply categories.',
}

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-3">
          Browse Categories
        </h1>
        <p className="text-taupe max-w-2xl mx-auto">
          Find supplies for every craft and hobby — from fabric and yarn to
          resin, clay, and everything in between.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <div
            key={category.slug}
            className="card hover:border-gold/60 hover:shadow-md transition-all"
          >
            <Link
              href={`/shop/products?category=${encodeURIComponent(category.name)}`}
              className="group flex items-center justify-between mb-2"
            >
              <h2 className="font-cormorant text-xl font-bold text-charcoal group-hover:text-gold transition-colors">
                {category.name}
              </h2>
              <ChevronRight className="h-4 w-4 text-taupe group-hover:text-gold transition-colors" />
            </Link>
            {category.description && (
              <p className="text-sm text-taupe mb-4">{category.description}</p>
            )}
            <div className="flex flex-wrap gap-2 border-t border-blush mt-4 pt-4">
              {category.subcategories.map((sub) => (
                <Link
                  key={sub}
                  href={`/shop/products?category=${encodeURIComponent(
                    category.name
                  )}&subcategory=${encodeURIComponent(sub)}`}
                  className="text-xs px-2.5 py-1 rounded-full bg-ivory text-taupe hover:bg-gold/10 hover:text-gold hover:underline underline-offset-4 decoration-gold/50 transition-colors"
                >
                  {sub}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/shop/products"
          className="btn btn-primary px-8 py-3 font-cormorant tracking-wider"
        >
          View All Products
        </Link>
      </div>
    </div>
  )
}
