import Link from 'next/link'

export default function ShopIndexPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <p className="text-taupe mb-4">Redirecting to shop...</p>
      <Link href="/shop/products" className="btn btn-primary px-6 py-2">
        Go to Shop
      </Link>
    </div>
  )
}
