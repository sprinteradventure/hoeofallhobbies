'use client'

import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo-of-all.png" alt="of all" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="font-cormorant text-3xl font-bold text-charcoal">Check Your Email</h1>
          <p className="text-taupe font-lora mt-1">You're almost part of the community</p>
        </div>

        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
            <MailCheck className="h-8 w-8 text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-charcoal font-lora mb-2">
            We've sent a confirmation link to your email address.
          </p>
          <p className="text-sm text-taupe font-lora">
            Click the link in that email to activate your account. It may take a minute to arrive —
            don't forget to check your spam folder.
          </p>

          <div className="mt-6 pt-4 border-t border-blush">
            <p className="text-sm text-taupe">
              Already confirmed?{' '}
              <Link href="/auth/login" className="text-gold font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
