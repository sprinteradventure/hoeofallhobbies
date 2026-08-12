import Link from 'next/link'
import { SmallMonogram } from './BrandLogo'

const SHOP_LINKS = [
  { href: '/shop/products', label: 'All Products' },
  { href: '/categories', label: 'Browse Categories' },
  { href: '/shop/cart', label: 'Cart' },
]

const SELL_LINKS = [
  { href: '/sell', label: 'Start Selling' },
  { href: '/seller/dashboard', label: 'Seller Dashboard' },
  { href: '/seller/orders', label: 'Seller Orders' },
]

const ACCOUNT_LINKS = [
  { href: '/auth/login', label: 'Sign In' },
  { href: '/auth/signup', label: 'Create Account' },
  { href: '/account', label: 'My Account' },
  { href: '/shop/orders', label: 'My Orders' },
]

const SUPPORT_LINKS = [
  { href: '/policies/returns', label: 'Returns & Refunds' },
  { href: '/policies/shipping', label: 'Shipping Policy' },
  { href: '/policies/terms', label: 'Terms of Service' },
  { href: '/policies/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact Us' },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="font-cormorant font-bold text-lg mb-4 tracking-wide">{title}</h3>
      {links.map((link, i) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className={`block text-taupe hover:text-gold text-sm font-lora transition-colors ${
            i < links.length - 1 ? 'mb-2' : ''
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-blush bg-ivory text-charcoal mt-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SmallMonogram />
              <span className="font-cormorant font-bold text-lg tracking-wide">Hoe of All Hobbies</span>
            </div>
            <p className="text-sm text-taupe font-lora leading-relaxed">
              Sustainable finds for creative minds. A curated marketplace for craft and hobby supplies.
            </p>
            <a
              href="mailto:hoardstashco@gmail.com"
              className="block mt-3 text-sm text-gold hover:underline font-lora"
            >
              hoardstashco@gmail.com
            </a>
          </div>
          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Sell" links={SELL_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
        </div>
        <div className="border-t border-blush pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SmallMonogram />
          </div>
          <p className="text-taupe text-sm font-lora">
            &copy; 2026 Hoe of All Hobbies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
