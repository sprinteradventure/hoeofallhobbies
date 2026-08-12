import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Hoe of All Hobbies',
  description:
    'How Hoe of All Hobbies collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Privacy Policy</h1>
      <p className="text-sm text-taupe font-lora mb-8">Last updated: August 12, 2026</p>

      <div className="space-y-6 font-lora text-charcoal leading-relaxed text-sm">
        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            What we collect
          </h2>
          <p className="mb-3">We collect the information needed to run the marketplace:</p>
          <ul className="list-disc list-inside space-y-2 text-taupe">
            <li>Account details (name, email address, password hash).</li>
            <li>Order information (items purchased, shipping address, order history).</li>
            <li>Messages exchanged between buyers and sellers on the platform.</li>
            <li>Usage data such as pages visited and device/browser information.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            How we use it
          </h2>
          <p>
            We use your information to process orders, connect buyers and sellers, provide customer
            support, send order and account notifications, improve the platform, and meet legal
            obligations. We do not sell your personal information.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Who we share it with
          </h2>
          <p className="mb-3">
            We share only what&apos;s needed with the service providers that run the marketplace:
          </p>
          <ul className="list-disc list-inside space-y-2 text-taupe">
            <li>
              <strong>Stripe</strong> — payment processing and seller payouts (Stripe Connect).
              Card details go directly to Stripe; we never see or store full card numbers.
            </li>
            <li>
              <strong>Resend</strong> — transactional email (order confirmations, notifications).
            </li>
            <li>
              <strong>Shipping carriers</strong> — your name and delivery address, shared by
              sellers so carriers can deliver your order.
            </li>
            <li>
              <strong>Sellers</strong> — the details required to fulfil your order.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">Cookies</h2>
          <p>
            We use essential cookies for sign-in sessions and cart functionality, and limited
            analytics to understand how the site is used. You can disable non-essential cookies in
            your browser settings.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Your choices and rights
          </h2>
          <p>
            You may access, correct, or delete your account information at any time from your
            account settings, or by emailing{' '}
            <a href="mailto:hoardstashco@gmail.com" className="text-gold hover:underline">
              hoardstashco@gmail.com
            </a>
            . We retain order records as required for tax and legal purposes.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            Data security
          </h2>
          <p>
            We use encryption in transit, hashed passwords, and access controls to protect your
            data. No method of transmission is 100% secure, but we work to protect your information
            and will notify you of any breach as required by law.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">Contact</h2>
          <p>
            Privacy questions? Email{' '}
            <a href="mailto:hoardstashco@gmail.com" className="text-gold hover:underline">
              hoardstashco@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
