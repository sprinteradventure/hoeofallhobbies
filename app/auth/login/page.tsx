'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      router.push('/shop/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="label block mb-2">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" required />
          </div>
          <div>
            <label htmlFor="password" className="label block mb-2">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="mt-6 text-center text-sm"><Link href="/auth/signup" className="text-brand-700 font-semibold">Create account</Link></div>
      </div>
    </div>
  )
}
