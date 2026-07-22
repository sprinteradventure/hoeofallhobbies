'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

// /sell sends logged-in users to the listing-creation flow and guests to login.
export default function SellPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/seller/listings/new')
      } else {
        router.replace('/auth/login')
      }
    }
    redirect()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <p className="text-taupe mb-4">
        {checking ? 'Taking you to the seller listing page...' : 'Redirecting...'}
      </p>
      <Link href="/seller/listings/new" className="text-gold hover:underline text-sm">
        Click here if you are not redirected
      </Link>
    </div>
  )
}
