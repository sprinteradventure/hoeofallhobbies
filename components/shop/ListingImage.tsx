'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { imageThumb, canOptimize } from '@/lib/imageThumb'

// ============================================================================
// ListingImage — the standard renderer for LISTING photos (product images).
// Don't use it for brand logos, local previews, or video.
//
//  * variant="thumb" (default) loads the 480px `_thumb.webp` derivative for
//    storage-hosted images; variant="full" loads the original (detail
//    gallery). If the preferred URL errors (legacy uploads have no thumb),
//    it swaps to the original once.
//  * Hosts outside next.config's image allowlist (arbitrary pasted URLs)
//    render as a plain <img> so they keep working unoptimized.
//  * Renders `fill` inside a relative, overflow-hidden wrapper — pass the
//    box classes (size/rounding) via className.
// ============================================================================

export default function ListingImage({
  src,
  alt,
  className = '',
  imageClassName = '',
  sizes = '400px',
  variant = 'thumb',
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  /** Extra classes for the image itself, e.g. group-hover zoom. */
  imageClassName?: string
  sizes?: string
  variant?: 'thumb' | 'full'
  priority?: boolean
}) {
  const preferred = variant === 'thumb' ? imageThumb(src) : src
  const [current, setCurrent] = useState(preferred)

  // Reset the fallback chain whenever the source changes (gallery index).
  useEffect(() => {
    setCurrent(preferred)
  }, [preferred])

  function handleError() {
    if (current !== src) setCurrent(src)
  }

  const optimizable = canOptimize(current)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {optimizable ? (
        <Image
          src={current}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imageClassName}`}
          onError={handleError}
        />
      ) : (
        // Arbitrary external hosts aren't in the optimizer allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt={alt}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover ${imageClassName}`}
        />
      )}
    </div>
  )
}
