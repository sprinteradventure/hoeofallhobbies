import type { Metadata } from 'next'
import { Cormorant, Lora, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getSiteName, getSiteUrl, getSiteDescription, getSiteType } from '@/lib/site-context-server'

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  const siteUrl = await getSiteUrl()
  const siteDescription = await getSiteDescription()
  const isHolidays = siteName === 'Hoe of All Holidays'
  const defaultTitle = isHolidays
    ? `${siteName} - Holiday Decor & Party Supplies Marketplace`
    : `${siteName} - Sustainable Craft Supplies Marketplace`
  const ogImage = isHolidays ? '/og-image-holidays.png' : '/og-image.png'

  return {
    metadataBase: new URL(siteUrl),
    title: defaultTitle,
    description: siteDescription,
    alternates: { canonical: '/' },
    icons: {
      icon: [
        { url: '/api/brand-icon?t=favicon', sizes: '48x48' },
        { url: '/api/brand-icon?t=icon', type: 'image/png', sizes: '512x512' },
      ],
      apple: '/api/brand-icon?t=apple',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: siteDescription,
      images: [ogImage],
    },
    verification: {
      // Pinterest domain verification (renders <meta name="p:domain_verify">)
      other: { 'p:domain_verify': '2bd6b860031482ec30bc9ddb6003bc20' },
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteType = await getSiteType()
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${lora.variable} ${playfair.variable}${siteType === 'holidays' ? ' site-holidays' : ''}`}
    >
      <body className="font-lora antialiased bg-cream text-charcoal">
        <Navbar isHolidays={siteType === 'holidays'} />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer isHolidays={siteType === 'holidays'} />
      </body>
    </html>
  )
}
