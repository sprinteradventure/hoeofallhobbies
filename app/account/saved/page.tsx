'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import ListingImage from '@/components/shop/ListingImage'

// /account/saved — the buyer's saved items list (migration 019: product_saves).

type SavedRow = {
  id: string // save row id
  created_at: string
  product: {
    id: string
    title: string
    price: number
    images: string[] | null
    seller_id: string
  } | null
}

export default function SavedPage() {
  const router = useRouter()
  const [items, setItems] = useState<SavedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    loadSaves()
  }, [])

  async function loadSaves() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      let data: any[] | null = null
      try {
        const res = await supabase
          .from('product_saves')
          .select('id, created_at, product:products(id, title, price, images, seller_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (res.error) throw res.error
        data = res.data
      } catch {
        setUnavailable(true)
        return
      }

      // Drop saves whose listing was deleted or deactivated.
      setItems(((data || []) as any[]).filter((r) => r.product?.id))
    } finally {
      setLoading(false)
    }
  }

  async function removeSave(saveId: string) {
    try {
      await supabase.from('product_saves').delete().eq('id', saveId)
      setItems((prev) => prev.filter((r) => r.id !== saveId))
    } catch {
      // non-fatal
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-taupe hover:text-gold font-lora mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>
      <h1 className="font-cormorant text-4xl font-bold text-charcoal mb-2 flex items-center gap-3">
        <Heart className="h-8 w-8 text-gold" />
        Saved Items
      </h1>
      <p className="text-taupe font-lora mb-8">Your shortlist — it stays here until you remove it or the listing sells out.</p>

      {unavailable ? (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800 font-lora">
            Saving items isn&apos;t enabled in this environment yet — it activates once migration 019
            (supabase/migrations/019_shop_engagement.sql) is applied.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-14">
          <Heart className="h-10 w-10 text-blush mx-auto mb-3" />
          <p className="text-taupe font-lora mb-5">Nothing saved yet. Tap the heart on any listing to keep it here.</p>
          <Link href="/shop/products" className="btn btn-primary px-8 py-3">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((row) => (
            <div key={row.id} className="card !p-3 relative group">
              <Link href={`/shop/products/${row.product!.id}`}>
                <div className="relative bg-neutral-100 rounded-lg aspect-square overflow-hidden mb-3">
                  {row.product!.images?.[0] ? (
                    <ListingImage
                      src={row.product!.images[0]}
                      alt={row.product!.title}
                      className="w-full h-full"
                      imageClassName="group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
                  )}
                </div>
                <h3 className="font-lora text-sm font-semibold text-charcoal line-clamp-2 leading-snug">{row.product!.title}</h3>
                <p className="text-gold font-bold mt-1">${Number(row.product!.price).toFixed(2)}</p>
              </Link>
              <button
                onClick={() => removeSave(row.id)}
                aria-label="Remove from saved items"
                className="absolute top-5 right-5 bg-white rounded-full p-2 shadow hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className="h-4 w-4 fill-gold text-gold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
