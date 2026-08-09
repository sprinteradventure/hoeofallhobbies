'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { User, Package, Store, LogOut, ShoppingBag, Edit2, Check, X, Mail } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Seller name editing ──
  const [editingName, setEditingName] = useState(false)
  const [sellerNameInput, setSellerNameInput] = useState('')

  // ── Email notification preference ──
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'saved' | 'error' | null>(null)

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
      setSellerNameInput(data?.seller_name || '')
      // Missing/NULL means enabled (column may not exist pre-migration-015).
      setNotifEnabled(data?.message_email_notifications !== false)
    } finally {
      setLoading(false)
    }
  }

  async function saveSellerName() {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ seller_name: sellerNameInput.trim() || null })
        .eq('id', profile.id)

      if (error) throw error

      setProfile((prev) =>
        prev ? { ...prev, seller_name: sellerNameInput.trim() || undefined } : null
      )
      setEditingName(false)
    } catch (err) {
      alert('Failed to save seller name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMessageEmails(next: boolean) {
    if (!profile || notifSaving) return
    setNotifEnabled(next) // optimistic
    setNotifSaving(true)
    setNotifStatus(null)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ message_email_notifications: next })
        .eq('id', profile.id)

      if (error) throw error

      setProfile((prev) =>
        prev ? { ...prev, message_email_notifications: next } : null
      )
      setNotifStatus('saved')
      setTimeout(() => setNotifStatus((s) => (s === 'saved' ? null : s)), 2500)
    } catch (err) {
      setNotifEnabled(!next) // revert optimistic update
      setNotifStatus('error')
    } finally {
      setNotifSaving(false)
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
    profile?.seller_name || profile?.full_name || profile?.username || email.split('@')[0]

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
          <div className="flex-1">
            <p className="font-cormorant text-xl font-bold text-charcoal">
              {displayName}
            </p>
            <p className="text-sm text-taupe">{email}</p>
            {profile?.is_seller && (
              <span className="badge badge-gold mt-1 inline-block">Seller</span>
            )}
          </div>
        </div>

        {/* Seller name editor (only for sellers) */}
        {profile?.is_seller && (
          <div className="mt-6 pt-6 border-t border-blush">
            <label className="label block mb-2">Seller Display Name</label>
            <p className="text-xs text-taupe mb-3">
              This is the name buyers see on your listings. Leave blank to use your account name.
            </p>

            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sellerNameInput}
                  onChange={(e) => setSellerNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveSellerName()
                    if (e.key === 'Escape') {
                      setEditingName(false)
                      setSellerNameInput(profile?.seller_name || '')
                    }
                  }}
                  placeholder="Your shop or brand name"
                  className="input flex-1"
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={saveSellerName}
                  disabled={saving}
                  className="btn btn-primary px-4 py-2"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setSellerNameInput(profile?.seller_name || '')
                  }}
                  className="btn btn-ghost border border-blush px-4 py-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-charcoal font-medium">
                  {profile?.seller_name || 'Not set — using account name'}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-gold hover:underline text-sm inline-flex items-center gap-1"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email notifications */}
      <div className="card mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-ivory flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-charcoal">Message notifications</p>
              <p className="text-sm text-taupe">
                Email me when someone messages me about a listing
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={notifEnabled}
            aria-label="Message email notifications"
            onClick={() => toggleMessageEmails(!notifEnabled)}
            disabled={notifSaving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 ${
              notifEnabled ? 'bg-gold' : 'bg-blush'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                notifEnabled ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {notifStatus === 'saved' && (
          <p className="text-sm text-green-700 mt-3">Preference saved</p>
        )}
        {notifStatus === 'error' && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
            Failed to save. Please try again.
          </p>
        )}
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
