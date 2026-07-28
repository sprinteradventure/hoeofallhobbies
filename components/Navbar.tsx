'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, ChevronDown, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SmallMonogram } from './BrandLogo'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Dynamically import the browser Supabase client: importing it at module
    // scope breaks static prerendering of the layout (it instantiates a client
    // with placeholder env vars during `next build`).
    let unsubscribe: (() => void) | null = null

    async function checkAdmin() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (!cancelled) setIsAdmin(false)
          return
        }
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) {
          if (!cancelled) setIsAdmin(false)
          return
        }
        const { isAdmin } = await res.json()
        if (!cancelled) setIsAdmin(!!isAdmin)
      } catch {
        if (!cancelled) setIsAdmin(false)
      }
    }

    async function init() {
      const { supabase } = await import('@/lib/supabase/client')
      checkAdmin()

      // Hide the admin control immediately when the session goes away (sign-out).
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session) setIsAdmin(false)
          else checkAdmin()
        }
      )
      unsubscribe = () => subscription.unsubscribe()
    }

    init()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

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
            <Link href="/" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider underline-offset-8 decoration-gold/70 decoration-2 hover:underline">
              Home
            </Link>

            <div className="relative group">
              <button className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider underline-offset-8 decoration-gold/70 decoration-2 hover:underline">
                Shop
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 border border-blush">
                <Link href="/categories" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                  Browse Categories
                </Link>
                <Link href="/shop/products" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                  All Products
                </Link>
              </div>
            </div>

            <Link href="/sell" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider underline-offset-8 decoration-gold/70 decoration-2 hover:underline">
              Sell
            </Link>
            <Link href="/account" className="text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider underline-offset-8 decoration-gold/70 decoration-2 hover:underline">
              Account
            </Link>
            {isAdmin && (
              <div className="relative group">
                <button className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors font-lora text-sm uppercase tracking-wider underline-offset-8 decoration-gold/70 decoration-2 hover:underline">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 border border-blush">
                  <Link href="/admin/dashboard" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                    Dashboard
                  </Link>
                  <Link href="/admin/moderation" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors font-lora">
                    Moderation
                  </Link>
                </div>
              </div>
            )}
            <Link href="/shop/cart" className="px-5 py-2.5 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 font-cormorant text-sm tracking-wider">
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
                <Link href="/shop/products" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm font-lora">
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
            {isAdmin && (
              <>
                <div className="flex items-center gap-2 py-2 px-2 text-charcoal font-lora">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  Admin
                </div>
                <div className="pl-4 space-y-1">
                  <Link href="/admin/dashboard" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm font-lora">
                    Dashboard
                  </Link>
                  <Link href="/admin/moderation" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm font-lora">
                    Moderation
                  </Link>
                </div>
              </>
            )}
            <Link href="/shop/cart" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors font-lora">
              Cart
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
