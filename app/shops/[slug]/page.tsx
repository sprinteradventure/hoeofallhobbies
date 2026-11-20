import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, MapPin, CalendarDays, BadgeCheck, Package, MessageCircle } from 'lucide-react'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSiteName, getSiteUrl, getSiteType } from '@/lib/site-context-server'
import { Shop, Product } from '@/lib/types'
import StorefrontClient from './StorefrontClient'

// ============================================================================
// /shops/[slug] — public seller storefront.
//
// Server-rendered for SEO + share previews: banner, story, announcement,
// social links, ratings, and the shop's active listings. Data comes via the
// service-role client (RLS on shops allows public SELECT anyway; products
// are filtered to the current marketplace and is_active).
// ============================================================================

type PageProps = { params: { slug: string } }

async function loadShop(slug: string) {
  const admin = getSupabaseAdmin()
  const siteType = await getSiteType()

  let shop: any = null
  try {
    const { data } = await admin
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    shop = data
  } catch {
    // Migration 018 not applied — the username fallback below still works.
  }

  // Fallback: no custom shop yet — resolve the seller by username and render
  // a basic storefront from their profile so every seller is shareable.
  let profile: any = null
  if (!shop) {
    const { data: byUsername } = await admin
      .from('user_profiles')
      .select('id, username, seller_name, avatar_url, avg_rating, total_reviews, total_sales, seller_verified, created_at, bio, location')
      .eq('username', slug)
      .maybeSingle()
    if (!byUsername) return null
    profile = byUsername
    shop = {
      id: '',
      seller_id: byUsername.id,
      slug,
      name: byUsername.seller_name || byUsername.username,
      story: byUsername.bio || '',
      avatar_url: byUsername.avatar_url || '',
      location: byUsername.location || '',
    }
  }

  if (!profile) {
    const { data: p } = await admin
      .from('user_profiles')
      .select('id, username, seller_name, avatar_url, avg_rating, total_reviews, total_sales, seller_verified, created_at')
      .eq('id', (shop as Shop).seller_id)
      .maybeSingle()
    profile = p
  }

  const { data: products } = await admin
    .from('products')
    .select('id, title, price, images, condition, category, quantity, listing_date')
    .eq('seller_id', (shop as Shop).seller_id)
    .eq('is_active', true)
    .or(`site.eq.${siteType},site.is.null`)
    .order('listing_date', { ascending: false })

  // Maker updates (migration 019) — tolerates absence.
  let posts: any[] = []
  try {
    const { data } = await admin
      .from('shop_posts')
      .select('id, body, product_id, created_at')
      .eq('seller_id', (shop as Shop).seller_id)
      .order('created_at', { ascending: false })
      .limit(10)
    posts = data || []
  } catch {
    posts = []
  }

  // Featured listings (migration 019) render first, in the seller's order.
  const rawProducts = (products || []) as Product[]
  const featuredIds: string[] = Array.isArray((shop as Shop).featured_product_ids)
    ? ((shop as Shop).featured_product_ids as string[])
    : []
  const featured = featuredIds
    .map((id) => rawProducts.find((p) => p.id === id))
    .filter((p): p is Product => !!p)
  const rest = rawProducts.filter((p) => !featuredIds.includes(p.id))
  const orderedProducts = [...featured, ...rest]

  return {
    shop: shop as Shop,
    profile,
    products: orderedProducts,
    featuredCount: featured.length,
    posts,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const siteName = await getSiteName()
  try {
    const loaded = await loadShop(params.slug)
    if (!loaded) return { title: 'Shop not found' }
    const { shop } = loaded
    const title = `${shop.name} on ${siteName}`
    const description =
      shop.tagline ||
      shop.story?.slice(0, 160) ||
      `Shop ${shop.name}'s handmade and vintage finds on ${siteName}.`
    return {
      title,
      description,
      alternates: { canonical: `${await getSiteUrl()}/shops/${shop.slug}` },
      openGraph: {
        type: 'profile',
        title,
        description,
        images: shop.banner_url || shop.avatar_url ? [{ url: shop.banner_url || shop.avatar_url! }] : undefined,
      },
    }
  } catch {
    return { title: 'Shop' }
  }
}

export default async function ShopPage({ params }: PageProps) {
  let loaded: Awaited<ReturnType<typeof loadShop>> = null
  try {
    loaded = await loadShop(params.slug)
  } catch (err) {
    console.error('Shop load failed (migration 018 applied?):', err)
  }
  if (!loaded) notFound()

  const { shop, profile, products, featuredCount, posts } = loaded
  const siteUrl = await getSiteUrl()
  const shareUrl = `${siteUrl}/shops/${shop.slug}`

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="pb-16">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-charcoal via-french-blue to-charcoal overflow-hidden">
        {shop.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, #c9a876 0, transparent 40%), radial-gradient(circle at 80% 70%, #ead6ce 0, transparent 40%)',
            }}
          />
        )}
        {shop.announcement && (
          <div className="absolute bottom-0 inset-x-0 bg-charcoal/80 backdrop-blur-sm text-cream text-center text-sm font-lora py-2 px-4">
            {shop.announcement}
          </div>
        )}
      </div>

      {/* Shop header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-cream bg-ivory overflow-hidden flex-shrink-0 shadow-md">
            {shop.avatar_url || profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.avatar_url || profile.avatar_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-cormorant text-4xl font-bold text-gold bg-blush/60">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-cormorant text-3xl sm:text-4xl font-bold text-charcoal">{shop.name}</h1>
              {profile?.seller_verified && (
                <span className="badge badge-green inline-flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            {shop.tagline && (
              <p className="text-taupe font-lora mt-1">{shop.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-taupe font-lora">
              {shop.location && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold" />{shop.location}</span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" />Member since {memberSince}</span>
              )}
              {profile?.avg_rating ? (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {Number(profile.avg_rating).toFixed(1)}
                  <span className="text-taupe/80">({profile.total_reviews || 0} reviews)</span>
                </span>
              ) : null}
              {(profile?.total_sales ?? 0) > 0 && (
                <span className="flex items-center gap-1.5"><Package className="h-4 w-4 text-gold" />{profile.total_sales} sales</span>
              )}
            </div>
          </div>

          <div className="sm:pb-1">
            <StorefrontClient
              shareUrl={shareUrl}
              shopName={shop.name}
              sellerId={shop.seller_id}
              instagramUrl={shop.instagram_url}
              pinterestUrl={shop.pinterest_url}
              facebookUrl={shop.facebook_url}
              websiteUrl={shop.website_url}
            />
          </div>
        </div>

        {/* Story */}
        {shop.story && (
          <div className="mt-8 card bg-ivory/60">
            <h2 className="font-cormorant text-xl font-bold text-charcoal mb-2">Our story</h2>
            <p className="text-taupe font-lora leading-relaxed whitespace-pre-line">{shop.story}</p>
          </div>
        )}

        {/* Maker updates feed */}
        {posts.length > 0 && (
          <div className="mt-10">
            <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-5">Updates from {shop.name}</h2>
            <div className="space-y-4">
              {posts.map((post: any) => (
                <div key={post.id} className="card bg-ivory/60 !py-4">
                  <p className="text-charcoal font-lora leading-relaxed whitespace-pre-line">{post.body}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-xs text-taupe">
                      {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {post.product_id && products.some((p) => p.id === post.product_id) && (
                      <Link
                        href={`/shop/products/${post.product_id}`}
                        className="text-xs text-gold hover:underline font-lora"
                      >
                        View the listing →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="mt-10">
          <h2 className="font-cormorant text-2xl font-bold text-charcoal mb-5">
            {featuredCount > 0 ? (
              <>Featured <span className="text-taupe text-lg font-lora">({featuredCount})</span></>
            ) : (
              <>Listings <span className="text-taupe text-lg font-lora">({products.length})</span></>
            )}
          </h2>

          {products.length === 0 ? (
            <div className="card text-center py-12">
              <Package className="h-10 w-10 text-blush mx-auto mb-3" />
              <p className="text-taupe font-lora">
                {shop.name} hasn&apos;t listed anything here yet — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, idx) => (
                <Link key={product.id} href={`/shop/products/${product.id}`} className="group">
                  <div className="card !p-3 h-full hover:-translate-y-1">
                    <div className="relative bg-neutral-100 rounded-lg aspect-square overflow-hidden mb-3">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
                      )}
                      {idx < featuredCount && (
                        <span className="absolute top-2 left-2 bg-gold text-white px-2 py-0.5 rounded text-xs font-semibold">
                          ★ Featured
                        </span>
                      )}
                      {product.condition && product.condition !== 'new' && (
                        <span className="absolute bottom-2 left-2 bg-charcoal/80 text-cream px-2 py-0.5 rounded text-xs">
                          {product.condition}
                        </span>
                      )}
                    </div>
                    <h3 className="font-lora text-sm font-semibold text-charcoal line-clamp-2 leading-snug">{product.title}</h3>
                    <p className="text-gold font-bold mt-1">${Number(product.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact hint */}
        <div className="mt-12 card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-gold flex-shrink-0" />
            <p className="text-charcoal font-lora text-sm">
              Questions about an item? Message {shop.name} directly from any listing page.
            </p>
          </div>
          <Link href={`/shop/products?seller=${shop.seller_id}`} className="btn btn-secondary px-6 py-2.5 text-sm font-cormorant tracking-wider flex-shrink-0">
            Browse this shop&apos;s items
          </Link>
        </div>
      </div>
    </div>
  )
}
