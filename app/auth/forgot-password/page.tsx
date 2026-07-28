'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Mail, KeyRound, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.hoeofallhobbies.com'}/auth/reset-password`,
      })

      if (authError) throw authError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/images/logo-of-all.png" alt="of all" className="h-12 mx-auto mb-4 object-contain" />
            <h1 className="font-cormorant text-3xl font-bold text-charcoal">Check Your Email</h1>
            <p className="text-taupe font-lora mt-1">Your reset link is on its way</p>
          </div>

          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
              <MailCheck className="h-8 w-8 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-charcoal font-lora mb-2">
              We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>.
            </p>
            <p className="text-sm text-taupe font-lora">
              Click the link in that email to choose a new password. It may take a minute to arrive —
              don&apos;t forget to check your spam folder.
            </p>

            <div className="mt-6 pt-4 border-t border-blush">
              <p className="text-sm text-taupe">
                Remembered it after all?{' '}
                <Link href="/auth/login" className="text-gold font-semibold hover:underline">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo-of-all.png" alt="of all" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="font-cormorant text-3xl font-bold text-charcoal">Reset Your Password</h1>
          <p className="text-taupe font-lora mt-1">We&apos;ll email you a link to set a new one</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="label block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-taupe" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blush text-center">
            <p className="text-sm text-taupe">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-gold font-semibold hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
