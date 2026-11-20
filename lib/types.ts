export interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
  seller_name?: string
  avatar_url?: string
  bio?: string
  location?: string
  is_seller: boolean
  seller_verified: boolean
  verification_status: 'unverified' | 'pending' | 'verified'
  avg_rating?: number
  total_sales: number
  total_reviews: number
  stripe_account_id?: string
  stripe_onboarding_complete?: boolean
  stripe_payouts_enabled?: boolean
  message_email_notifications?: boolean
  ship_name?: string
  ship_street1?: string
  ship_street2?: string
  ship_city?: string
  ship_state?: string
  ship_zip?: string
  ship_country?: string
  ship_phone?: string
  default_length_in?: number
  default_width_in?: number
  default_height_in?: number
  default_weight_oz?: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string
  category: string
  subcategory?: string
  categories?: string[]
  subcategories?: string[]
  video_url?: string
  site?: 'hobbies' | 'holidays'
  price: number
  condition: 'new' | 'like-new' | 'used' | 'damaged'
  quantity: number
  images: string[]
  dimensions?: Record<string, unknown>
  weight?: number
  weight_oz?: number
  length_in?: number
  width_in?: number
  height_in?: number
  tags: string[]
  is_active: boolean
  views_count: number
  listing_date: string
  updated_at: string
  seller?: UserProfile
  /** 'digital' = instant-download template; missing column (pre-migration) reads as physical */
  product_type?: 'physical' | 'digital'
  /** Storage path in the private digital-files bucket (digital products only) */
  digital_file_path?: string | null
  /** True when the seller disclosed AI-generated content (Terms of Service) */
  ai_generated?: boolean
}

export interface Order {
  id: string
  buyer_id: string
  seller_id: string
  product_id: string
  quantity: number
  status: 'pending' | 'payment_pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled'
  total_price: number
  platform_fee?: number
  shipping_address?: Record<string, unknown>
  shipping_cost?: number
  shipping_service_level?: string
  shippo_shipment_id?: string
  shippo_rate_id?: string
  shippo_transaction_id?: string
  label_url?: string
  tracking_number?: string
  tracking_url?: string
  stripe_payment_intent_id: string
  stripe_transfer_id?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  product?: Product
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  product?: Product
}

export interface Conversation {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  product?: Product
}

export interface ConversationSummary {
  id: string
  role: 'buyer' | 'seller'
  updated_at: string
  product: { id: string; title: string; image: string | null } | null
  other_party: { id?: string; name: string }
  last_message: { body: string; sender_id: string; created_at: string } | null
  unread_count: number
}

export interface Message {
  id: string
  conversation_id?: string
  sender_id: string
  body: string
  read_at?: string | null
  created_at: string
}


// ── Seller shops (migration 018) ────────────────────────────────────────────
// Public storefront for each seller. RLS: world-readable, owner-writable.
export interface Shop {
  id: string
  seller_id: string
  slug: string
  name: string
  tagline?: string
  story?: string
  banner_url?: string
  avatar_url?: string
  announcement?: string
  location?: string
  website_url?: string
  instagram_url?: string
  pinterest_url?: string
  facebook_url?: string
  featured_product_ids?: string[]
  created_at: string
  updated_at: string
}

// Seller-issued coupon codes (migration 018). Managed by the seller from the
// Marketing hub; validated server-side during checkout.
export interface SellerCoupon {
  id: string
  seller_id: string
  code: string
  percent_off: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
