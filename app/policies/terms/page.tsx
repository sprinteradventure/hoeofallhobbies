import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Hoe of All Hobbies',
  description:
    'The terms that govern buying and selling on Hoe of All Hobbies, a curated marketplace for craft and hobby supplies.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2">Terms of Service</h1>
      <p className="text-sm text-taupe font-lora mb-8">Last updated: August 12, 2026</p>

      <div className="space-y-6 font-lora text-charcoal leading-relaxed text-sm">
        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">1. Who we are</h2>
          <p>
            Hoe of All Hobbies (&quot;we&quot;, &quot;the platform&quot;) operates an online
            marketplace where independent sellers list and sell craft and hobby supplies directly
            to buyers. We provide the venue; sellers are responsible for their listings, inventory,
            fulfilment, and customer service.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            2. Marketplace role
          </h2>
          <p>
            We are not the seller of record for marketplace items. Each purchase forms a contract
            directly between you and the seller. We facilitate payment, messaging, and dispute
            mediation, and we may step in when our policies are violated.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            3. Accounts
          </h2>
          <p>
            You must provide accurate information when creating an account and keep your
            credentials secure. You are responsible for activity under your account. We may
            suspend accounts that violate these terms or our policies.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            4. Payments and fees
          </h2>
          <p>
            Payments are processed securely by Stripe. Sellers receive payouts through Stripe
            Connect after the platform fee is deducted. Prices are listed in US dollars and include
            applicable shipping charges shown at checkout.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            5. Seller obligations
          </h2>
          <p>
            Sellers must accurately describe items, honor stated handling times, respond to buyer
            messages within 3 business days, and comply with our Returns &amp; Refunds Policy.
            Prohibited items (weapons, hazardous materials, counterfeit goods, and items violating
            intellectual-property rights) may not be listed.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            6. Intellectual property
          </h2>
          <p>
            Sellers retain ownership of their listings and grant us a license to display and
            promote them on the platform. Report infringement concerns to{' '}
            <a href="mailto:support@hoeofallhobbies.com" className="text-gold hover:underline">
              support@hoeofallhobbies.com
            </a>
            .
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            7. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, Hoe of All Hobbies is not liable for indirect,
            incidental, or consequential damages arising from marketplace transactions. Our total
            liability for any claim is limited to the fees we collected for the transaction at
            issue.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            8. Governing law
          </h2>
          <p>
            These terms are governed by the laws of the State of Delaware, without regard to
            conflict-of-law principles. Disputes will be resolved in the state or federal courts
            located in Delaware.
          </p>
        </section>

        <section className="card">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-3">
            9. Changes
          </h2>
          <p>
            We may update these terms from time to time. Material changes will be announced on the
            site, and the &quot;Last updated&quot; date above reflects the current version.
            Continued use of the platform after changes take effect constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  )
}
