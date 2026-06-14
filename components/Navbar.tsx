'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { SmallMonogram } from './BrandLogo'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-blush bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3">
            <SmallMonogram />
            <span className="font-cormorant text-xl font-bold text-charcoal hidden sm:inline tracking-wide">
              Hoe of All Hobbies
            </span>
          </Link>

          <div className="hidden lg:flex gap-8 items-center">
            <Link href="/" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider">
              Home
            </Link>

            <div className="relative group">
              <button className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider">
                Shop
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 border border-blush">
                <Link href="/categories" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                  Browse Categories
                </Link>
                <Link href="/shop" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                  All Products
                </Link>
              </div>
            </div>

            <Link href="/sell" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider">
              Sell
            </Link>
            <Link href="/account" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider">
              Account
            </Link>
            <Link href="/cart" className="px-5 py-2.5 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 font-cormorant text-sm tracking-wider">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2">
            <Menu className="h-6 w-6 text-charcoal" />
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-blush">
            <Link href="/" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors font-lora">
              Home
            </Link>
            <button onClick={() => setCategoryOpen(!categoryOpen)} className="w-full text-left py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors flex items-center justify-between font-lora">
              Shop
              <ChevronDown className={`h-4 w-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryOpen && (
              <div className="pl-4 space-y-1">
                <Link href="/categories" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm font-lora">
                  Browse Categories
                </Link>
                <Link href="/shop" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm font-lora">
                  All Products
                </Link>
              </div>
            )}
            <Link href="/sell" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors font-lora">
              Sell
            </Link>
            <Link href="/account" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors font-lora">
              Account
            </Link>
            <Link href="/cart" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors font-lora">
              Cart
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
