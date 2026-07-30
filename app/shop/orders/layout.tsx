import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Orders are user-specific — keep out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children
}
