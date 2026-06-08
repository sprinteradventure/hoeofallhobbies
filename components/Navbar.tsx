'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-brand-700">
            🌱 Hoe of All Hobbies
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            <Link href="/shop/products" className="text-neutral-600 hover:text-neutral-900">
              Shop
            </Link>
            <Link href="/seller/dashboard" className="text-neutral-600 hover:text-neutral-900">
              Sell
            </Link>
            <Link href="/auth/login" className="text-neutral-600 hover:text-neutral-900">
              Sign In
            </Link>
            <Link href="/shop/cart" className="btn-primary px-4 py-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/shop/products" className="block py-2 text-neutral-600">
              Shop
            </Link>
            <Link href="/seller/dashboard" className="block py-2 text-neutral-600">
              Sell
            </Link>
            <Link href="/auth/login" className="block py-2 text-neutral-600">
              Sign In
            </Link>
            <Link href="/shop/cart" className="block py-2 text-neutral-600">
              Cart
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
