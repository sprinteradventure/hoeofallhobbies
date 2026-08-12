import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy | Hoe of All Hobbies',
  description:
    'Shipping times, carriers, and tracking for orders on Hoe of All Hobbies, where independent sellers ship directly to you.',
}

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Shipping Policy</h1>
      <p className="text-sm text-taupe font-lora mb-8">Last updated: August 12, 2026</p>

      <div className="space-y-6 font-lora text-charcoal leading-relaxed">
        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Sellers ship directly
          </h2>
          <p className="text-sm">
            Hoe of All Hobbies is a marketplace: every order is packed and shipped by the
            independent seller you bought from, not from a central warehouse. Shipping options and
            costs are shown at checkout before you pay.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Dispatch time
          </h2>
          <p className="text-sm">
            Sellers dispatch orders within <strong>3–5 business days</strong> of payment. Many ship
            faster — each listing notes the seller&apos;s handling time where it differs.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Delivery estimates (US)
          </h2>
          <p className="text-sm">
            Once dispatched, US deliveries typically arrive in <strong>3–8 business days</strong>{' '}
            depending on the carrier service selected at checkout. You&apos;ll receive a tracking
            number as soon as your order ships, visible on your order page.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Digital items
          </h2>
          <p className="text-sm">
            Digital PDF patterns are delivered instantly after payment — no shipping, no waiting.
            A download link appears on your order confirmation and in your account.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Questions about a shipment?
          </h2>
          <p className="text-sm">
            Message the seller directly from your order page for shipping questions. If you
            can&apos;t reach them, email{' '}
            <a href="mailto:hoardstashco@gmail.com" className="text-gold hover:underline">
              hoardstashco@gmail.com
            </a>{' '}
            and we&apos;ll help.
          </p>
        </section>
      </div>
    </div>
  )
}
