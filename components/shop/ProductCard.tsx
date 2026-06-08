'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart } from 'lucide-react'
import { Product } from '@/lib/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/shop/products/${product.id}`}>
      <div className="card h-full hover:shadow-lg transition-shadow cursor-pointer space-y-3">
        <div className="relative bg-neutral-200 rounded-lg aspect-square overflow-hidden group">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2">
            <button className="bg-white rounded-full p-2 hover:bg-neutral-100">
              <Heart className="h-4 w-4" />
            </button>
          </div>
          {product.condition !== 'new' && (
            <div className="absolute bottom-2 left-2 bg-brand-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {product.condition}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2">{product.title}</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-brand-700">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-neutral-500">
              {product.quantity} available
            </span>
          </div>

          {product.seller && (
            <div className="text-xs text-neutral-600">
              <p>by {(product.seller as any).username}</p>
              {(product.seller as any).avg_rating && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span>{(product.seller as any).avg_rating}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
