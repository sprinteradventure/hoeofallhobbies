'use client'

import { useState, useEffect } from 'react'
import { HOBBIES_CATEGORIES, HOLIDAY_CATEGORIES, type CategoryGroup } from './categories'

export type SiteType = 'hobbies' | 'holidays'

// ── Client-side helpers ────────────────────────────────────────────────────

export function getSiteTypeFromCookie(): SiteType {
  if (typeof document === 'undefined') return 'hobbies'
  const match = document.cookie.match(/(?:^|; )site-type=([^;]*)/)
  return (match?.[1] as SiteType) || 'hobbies'
}

export function useSiteType(): SiteType {
  const [siteType, setSiteType] = useState<SiteType>('hobbies')

  useEffect(() => {
    setSiteType(getSiteTypeFromCookie())
  }, [])

  return siteType
}

export function getSiteCategories(siteType?: SiteType): CategoryGroup[] {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays' ? HOLIDAY_CATEGORIES : HOBBIES_CATEGORIES
}

export function useSiteCategories(): CategoryGroup[] {
  const siteType = useSiteType()
  return getSiteCategories(siteType)
}

// ── Site branding helpers ──────────────────────────────────────────────────

export function getSiteName(siteType?: SiteType): string {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays'
    ? 'Hoe of All Holidays'
    : 'Hoe of All Hobbies'
}

export function getSiteUrl(siteType?: SiteType): string {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays'
    ? 'https://www.hoeofallholidays.com'
    : 'https://www.hoeofallhobbies.com'
}

export function getSiteDescription(siteType?: SiteType): string {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays'
    ? 'Discover and sell holiday decor, party supplies, and celebration essentials for every culture, tradition, and occasion.'
    : 'The curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators worldwide.'
}

export function getHomeHeroTagline(siteType?: SiteType): string {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays'
    ? 'The curated marketplace for holiday decor and celebration supplies. Buy and sell decorations, party essentials, and festive finds for every tradition.'
    : 'The curated marketplace for craft and hobby supplies. Buy and sell rare, vintage, and new finds from passionate creators worldwide.'
}

export function getHomeFeaturesTitle(siteType?: SiteType): string {
  const type = siteType || getSiteTypeFromCookie()
  return type === 'holidays' ? 'Built for Celebrations' : 'Built for Crafters'
}

export function getHomeFeatures(siteType?: SiteType): { title: string; desc: string }[] {
  const type = siteType || getSiteTypeFromCookie()
  if (type === 'holidays') {
    return [
      { title: 'Cultural & Inclusive', desc: 'Find decor and supplies for holidays from every culture, religion, and tradition — all in one place.' },
      { title: 'Seasonal Finds', desc: 'Discover rare, vintage, and handmade decorations you won\'t find in big-box stores.' },
      { title: 'Community Driven', desc: 'Connect with fellow hosts, DIY decorators, and party planners worldwide.' },
      { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 95%, we take only 5% to keep the marketplace running.' },
      { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
      { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
    ]
  }
  return [
    { title: 'Sustainable', desc: 'Give vintage and second-hand supplies a new home. Reduce waste, support circular crafting.' },
    { title: 'Quality Finds', desc: 'Discover rare, vintage, and hard-to-find supplies you won\'t find anywhere else.' },
    { title: 'Community Driven', desc: 'Connect with fellow crafters and hobbyists. Support creative makers worldwide.' },
    { title: 'Fair Pricing', desc: 'Transparent pricing: sellers keep 95%, we take only 5% to keep the marketplace running.' },
    { title: 'Secure Transactions', desc: 'Stripe-powered payments with buyer and seller protection for peace of mind.' },
    { title: 'Easy Shipping', desc: 'Integrated shipping labels and tracking. Just add your carrier info when ready.' }
  ]
}

export function getHomeHowItWorks(siteType?: SiteType): { step: string; title: string; description: string; icon: string }[] {
  const type = siteType || getSiteTypeFromCookie()
  if (type === 'holidays') {
    return [
      {
        step: '1',
        title: 'List Your Decor',
        description: 'Upload photos, set your price, and choose from 30+ holiday and party categories. No listing fees.',
        icon: '✨'
      },
      {
        step: '2',
        title: 'Connect & Sell',
        description: 'Buyers discover your items through smart search and category browsing for every celebration.',
        icon: '🤝'
      },
      {
        step: '3',
        title: 'Keep 95%',
        description: 'We only take 5% to keep the marketplace running. You keep the rest.',
        icon: '💰'
      }
    ]
  }
  return [
    {
      step: '1',
      title: 'List Your Supplies',
      description: 'Upload photos, set your price, and choose from 23+ categories. No listing fees.',
      icon: '✨'
    },
    {
      step: '2',
      title: 'Connect & Sell',
      description: 'Buyers discover your items through smart search and category browsing.',
      icon: '🤝'
    },
    {
      step: '3',
      title: 'Keep 95%',
      description: 'We only take 5% to keep the marketplace running. You keep the rest.',
      icon: '💰'
    }
  ]
}
