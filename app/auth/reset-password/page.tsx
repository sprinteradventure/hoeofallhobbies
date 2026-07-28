'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'

type PageState = 'checking' | 'ready' | 'no-session' | 'done'

export default function ResetPasswordPage() {
  const [state, setState] = useState<PageState>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase recovery links establish a session automatically when opened.
    // If there's no session, the user landed here without a valid recovery link.
    let cancelled = false

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setState(data.session ? 'ready' : 'no-session')
    }

    // Also listen for the PASSWORD_RECOVERY event in case the session is
    // established asynchronously after the URL hash is parsed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setState('ready')
      }
    })

    checkSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw authError
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
        <p className="text-taupe font-lora">Verifying your reset link...</p>
      </div>
    )
  }

  if (state === 'no-session') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/images/logo-of-all.png" alt="of all" className="h-12 mx-auto mb-4 object-contain" />
            <h1 className="font-cormorant text-3xl font-bold text-charcoal">Link Expired</h1>
          </div>

          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
              <AlertCircle className="h-8 w-8 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-charcoal font-lora mb-2">
              This reset link is invalid or has expired.
            </p>
            <p className="text-sm text-taupe font-lora">
              Reset links only work once and expire after a short time. Request a fresh one to continue.
            </p>

            <div className="mt-6 pt-4 border-t border-blush">
              <Link href="/auth/forgot-password" className="btn btn-primary inline-flex items-center gap-2 px-6 py-3">
                <KeyRound className="h-4 w-4" />
                Request a New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-ivory to-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/images/logo-of-all.png" alt="of all" className="h-12 mx-auto mb-4 object-contain" />
            <h1 className="font-cormorant text-3xl font-bold text-charcoal">Password Updated</h1>
          </div>

          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
              <CheckCircle2 className="h-8 w-8 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-charcoal font-lora mb-2">
              Your password has been updated successfully.
            </p>
            <p className="text-sm text-taupe font-lora">
              You can now sign in with your new password.
            </p>

            <div className="mt-6 pt-4 border-t border-blush">
              <Link href="/auth/login" className="btn btn-primary inline-flex items-center gap-2 px-6 py-3">
                Continue to Sign In
              </Link>
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
          <h1 className="font-cormorant text-3xl font-bold text-charcoal">Choose a New Password</h1>
          <p className="text-taupe font-lora mt-1">Almost done — pick something memorable</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="label block mb-2">New Password</label>
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

            <div>
              <label className="label block mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-taupe" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="input pl-11"
                  minLength={8}
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-blush text-center">
            <p className="text-sm text-taupe">
              Changed your mind?{' '}
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
