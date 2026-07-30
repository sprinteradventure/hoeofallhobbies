import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Private seller area — keep out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  return children
}
