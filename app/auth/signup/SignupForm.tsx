'use client'

import AuthBrandLogo from '@/components/AuthBrandLogo'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client-lazy'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import { getSiteName, getSiteUrl } from '@/lib/site-context'
import TurnstileWidget, { resetTurnstile } from '@/components/TurnstileWidget'

export default function SignupForm({ isHolidays }: { isHolidays: boolean }) {
  const router = useRouter()
  const siteType = isHolidays ? 'holidays' as const : 'hobbies' as const
  const siteName = getSiteName(siteType)
  const siteUrl = getSiteUrl(siteType)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  // Only require a CAPTCHA token when a Turnstile site key is configured.
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = await getSupabase()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaRequired ? captchaToken : undefined,
          data: { username: username || email.split('@')[0] },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })

      if (authError) {
        // If Supabase rejected the challenge, give the user a fresh one.
        const msg = authError.message?.toLowerCase() ?? ''
        if (msg.includes('captcha') || msg.includes('challenge')) {
          setCaptchaToken(null)
          resetTurnstile()
        }
        throw authError
      }

      // user_profiles row is created server-side by the on_auth_user_created
      // trigger (migration 008). A direct insert here can never succeed before
      // email confirmation because there is no session, so RLS blocks it.
      router.push('/auth/verify-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuthBrandLogo isHolidays={isHolidays} />
          <h1 className="font-cormorant text-3xl font-bold text-charcoal">Create Account</h1>
          <p className="text-taupe font-lora mt-1">Join the {siteName} community</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
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

            <div>
              <label className="label block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-taupe" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="label block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-taupe" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  className="input pl-11"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {captchaRequired && (
              <TurnstileWidget
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
              />
            )}

            <button
              type="submit"
              disabled={loading || (captchaRequired && !captchaToken)}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blush text-center">
            <p className="text-sm text-taupe">
              Already have an account?{' '}
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
