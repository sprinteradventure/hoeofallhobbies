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
  price: number
  condition: 'new' | 'like-new' | 'used' | 'damaged'
  quantity: number
  images: string[]
  dimensions?: Record<string, unknown>
  weight?: number
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
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled'
  total_price: number
  shipping_address?: Record<string, unknown>
  tracking_number?: string
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
