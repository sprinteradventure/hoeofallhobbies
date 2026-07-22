'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { User, Package, Store, LogOut, ShoppingBag } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccount()
  }, [])

  async function loadAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setEmail(user.email || '')

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    )
  }

  const displayName =
    profile?.full_name || profile?.username || email.split('@')[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-8">
        My Account
      </h1>

      {/* Profile card */}
      <div className="card mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-ivory flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-gold" />
          </div>
          <div>
            <p className="font-cormorant text-xl font-bold text-charcoal">
              {displayName}
            </p>
            <p className="text-sm text-taupe">{email}</p>
            {profile?.is_seller && (
              <span className="badge badge-gold mt-1 inline-block">Seller</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/shop/orders" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Package className="h-6 w-6 text-gold flex-shrink-0" />
          <div>
            <p className="font-semibold text-charcoal">My Orders</p>
            <p className="text-sm text-taupe">Track purchases and deliveries</p>
          </div>
        </Link>

        <Link href="/shop/cart" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-gold flex-shrink-0" />
          <div>
            <p className="font-semibold text-charcoal">My Cart</p>
            <p className="text-sm text-taupe">Review items before checkout</p>
          </div>
        </Link>

        <Link href="/seller/dashboard" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Store className="h-6 w-6 text-gold flex-shrink-0" />
          <div>
            <p className="font-semibold text-charcoal">Seller Dashboard</p>
            <p className="text-sm text-taupe">Manage your listings and sales</p>
          </div>
        </Link>

        <Link href="/sell" className="card hover:shadow-md transition-shadow flex items-center gap-3">
          <Store className="h-6 w-6 text-gold flex-shrink-0" />
          <div>
            <p className="font-semibold text-charcoal">List an Item</p>
            <p className="text-sm text-taupe">Sell supplies you no longer need</p>
          </div>
        </Link>
      </div>

      <button
        onClick={handleSignOut}
        className="btn btn-ghost border border-blush px-6 py-2.5 flex items-center gap-2 text-charcoal"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}
