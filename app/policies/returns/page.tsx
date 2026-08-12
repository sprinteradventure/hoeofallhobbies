import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy | Hoe of All Hobbies',
  description:
    'How returns and refunds work on Hoe of All Hobbies, a marketplace where independent sellers ship directly to you.',
}

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">
        Returns &amp; Refunds Policy
      </h1>
      <p className="text-sm text-taupe font-lora mb-8">Last updated: August 12, 2026</p>

      <div className="space-y-6 font-lora text-charcoal leading-relaxed">
        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            A marketplace, not a warehouse
          </h2>
          <p className="text-sm">
            Hoe of All Hobbies is a curated marketplace. Each order is sold and shipped directly
            by an independent seller, not by us. That means returns are handled between you and
            the seller, with our support team available if you get stuck.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            14-day return window
          </h2>
          <p className="text-sm mb-3">
            You may request a return within <strong>14 days of delivery</strong> for most physical
            items. To start a return:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-2 text-taupe">
            <li>
              Go to <Link href="/shop/orders" className="text-gold hover:underline">My Orders</Link> and
              find the order.
            </li>
            <li>
              Use <strong>Message Seller</strong> (also available via{' '}
              <Link href="/messages" className="text-gold hover:underline">Messages</Link>) to request
              a return and describe the reason.
            </li>
            <li>
              The seller will respond within <strong>3 business days</strong> with return
              instructions and the return address.
            </li>
          </ol>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Refund timing
          </h2>
          <p className="text-sm">
            Once the seller receives the returned item, your refund is issued to your original
            payment method within <strong>5–10 business days</strong> (your bank may take a little
            longer to post it). Refunds cover the item price; original shipping is refunded only
            when the item was damaged, defective, or not as described.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Return shipping costs
          </h2>
          <p className="text-sm">
            Buyers cover return shipping for change-of-mind returns. If your item arrived{' '}
            <strong>damaged, defective, or not as described</strong>, the seller covers return
            shipping — include photos in your first message so they can make it right quickly.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Digital items
          </h2>
          <p className="text-sm">
            Digital PDF patterns and downloads are <strong>non-refundable once downloaded</strong>.
            If a file is corrupted or you can&apos;t access your purchase, message the seller or
            contact us and we&apos;ll sort it out.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Need a hand?
          </h2>
          <p className="text-sm">
            If a seller doesn&apos;t respond within 3 business days, or you can&apos;t reach an
            agreement, email us at{' '}
            <a href="mailto:support@hoeofallhobbies.com" className="text-gold hover:underline">
              support@hoeofallhobbies.com
            </a>{' '}
            and we&apos;ll step in to mediate.
          </p>
        </section>
      </div>
    </div>
  )
}
