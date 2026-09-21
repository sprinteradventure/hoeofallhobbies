'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // R9: the email-confirmation link carries ?code= which MUST be exchanged
    // for a session; previously this page redirected without exchanging and
    // the confirmation silently did nothing.
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    // Only allow internal redirect targets (open-redirect guard).
    const next = params.get('next')
    const destination =
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

    if (!code) {
      router.replace(destination)
      return
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .catch((err) => console.error('Email confirmation exchange failed:', err))
      .finally(() => router.replace(destination))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Confirming your email...</h1>
        <p className="text-neutral-600">You will be redirected shortly.</p>
      </div>
    </div>
  )
}
