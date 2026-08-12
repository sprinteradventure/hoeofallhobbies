import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, Package } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Hoe of All Hobbies',
  description:
    'Get in touch with the Hoe of All Hobbies support team — order help, seller questions, and general inquiries.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Contact Us</h1>
      <p className="text-sm text-taupe font-lora mb-8">
        We&apos;re a small team and we read every message.
      </p>

      <div className="space-y-6 font-lora text-charcoal leading-relaxed">
        <section className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blush/40 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-2">Email us</h2>
              <p className="text-sm mb-2">
                The fastest way to reach support for any question — orders, account issues, seller
                onboarding, or press:
              </p>
              <a
                href="mailto:support@hoeofallhobbies.com"
                className="text-gold hover:underline font-semibold"
              >
                support@hoeofallhobbies.com
              </a>
              <p className="text-sm text-taupe mt-2">
                We reply within 1–2 business days.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blush/40 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-2">
                Question about an item or order?
              </h2>
              <p className="text-sm">
                Because sellers ship directly, they&apos;re the experts on their own items. Use{' '}
                <Link href="/messages" className="text-gold hover:underline">
                  Messages
                </Link>{' '}
                to contact the seller from any listing or from{' '}
                <Link href="/shop/orders" className="text-gold hover:underline">
                  My Orders
                </Link>
                . If a seller doesn&apos;t respond within 3 business days, email us and we&apos;ll
                step in.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blush/40 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-2">
                Policies
              </h2>
              <p className="text-sm mb-2">Looking for the fine print?</p>
              <ul className="text-sm space-y-1">
                <li>
                  <Link href="/policies/returns" className="text-gold hover:underline">
                    Returns &amp; Refunds Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/shipping" className="text-gold hover:underline">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/policies/terms" className="text-gold hover:underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/policies/privacy" className="text-gold hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
