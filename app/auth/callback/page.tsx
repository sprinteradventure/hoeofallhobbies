'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after email confirmation
    router.push('/')
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
