import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Auth flows (login/signup) — keep out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
