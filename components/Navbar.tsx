'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { HoeMonogram } from './BrandLogo'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-ivory bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center -my-2">
              <HoeMonogram />
            </div>
            <span className="font-cormorant text-lg font-bold text-charcoal hidden sm:inline">
              Hoe of All Hobbies
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-8 items-center">
            <Link href="/" className="text-charcoal hover:text-gold transition-colors font-lora">
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 text-charcoal hover:text-gold transition-colors font-lora">
                Shop
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                <Link href="/categories" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors">
                  Browse Categories
                </Link>
                <Link href="/shop" className="block px-4 py-2 text-charcoal hover:bg-ivory transition-colors">
                  All Products
                </Link>
              </div>
            </div>

            <Link href="/sell" className="text-charcoal hover:text-gold transition-colors font-lora">
              Sell
            </Link>
            <Link href="/account" className="text-charcoal hover:text-gold transition-colors font-lora">
              Account
            </Link>
            <Link href="/cart" className="btn-primary px-4 py-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2"
          >
            <Menu className="h-6 w-6 text-charcoal" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4 space-y-2 border-t border-ivory">
            <Link href="/" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors">
              Home
            </Link>
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="w-full text-left py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors flex items-center justify-between"
            >
              Shop
              <ChevronDown className={`h-4 w-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryOpen && (
              <div className="pl-4 space-y-1">
                <Link href="/categories" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm">
                  Browse Categories
                </Link>
                <Link href="/shop" className="block py-2 px-2 text-taupe hover:bg-ivory rounded transition-colors text-sm">
                  All Products
                </Link>
              </div>
            )}
            <Link href="/sell" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors">
              Sell
            </Link>
            <Link href="/account" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded transition-colors">
              Account
            </Link>
            <Link href="/cart" className="block py-2 px-2 text-charcoal hover:bg-ivory rounded