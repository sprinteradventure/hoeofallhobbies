export interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
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
