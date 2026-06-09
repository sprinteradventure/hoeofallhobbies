'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Edit, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'

export default function SellerListingsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('listing_date', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Listings</h1>
        <Link href="/seller/listings/new" className="btn-primary px-6 py-2 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Listing
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-neutral-600 mb-4">You haven't listed any products yet</p>
          <Link href="/seller/listings/new" className="btn-primary px-6 py-2">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="card flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{product.title}</h3>
                <div className="grid grid-cols-4 gap-4 text-sm text-neutral-600 mt-2">
                  <div>
                    <span className="font-semibold">Price:</span> ${product.price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-semibold">Stock:</span> {product.quantity}
                  </div>
                  <div>
                    <span className="font-semibold">Views:</span> {product.views_count}
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Link
                  href={`/seller/listings/${product.id}/edit`}
                  className="btn-secondary p-2"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="btn-secondary p-2 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
