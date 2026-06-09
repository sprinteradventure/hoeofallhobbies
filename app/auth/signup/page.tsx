'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
      })

      if (authError) throw authError

      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email,
          username: username || email.split('@')[0],
        })
      }

      router.push('/auth/verify-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSignup} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input w-full" required />
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="input w-full" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" className="input w-full" minLength={8} required />
          <button type="submit" disabled={loading} className="btn-primary w-full py-2">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="mt-6 text-center text-sm"><Link href="/auth/login" className="text-brand-700 font-semibold">Sign in instead</Link></div>
      </div>
    </div>
  )
}
