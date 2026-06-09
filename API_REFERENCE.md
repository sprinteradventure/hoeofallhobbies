# API Reference - Hoe of All Hobbies

## Overview

The application uses Supabase for data storage and Next.js API routes for backend functionality.

## HTTP API Endpoints

### Health Check

**GET** `/api/health`

Check if the application is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-09T10:30:00Z"
}
```

---

### Database Migrations

**GET** `/api/migrations`

Get information about the migration endpoint.

**Response:**
```json
{
  "message": "Migration endpoint ready",
  "method": "POST",
  "auth": "Bearer token required"
}
```

**POST** `/api/migrations`

Run database migrations to set up the complete schema.

**Headers:**
- `Authorization: Bearer {MIGRATION_SECRET_KEY}`

**Response (Success):**
```json
{
  "success": true,
  "message": "Database migrations completed",
  "timestamp": "2026-06-09T10:30:00Z"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid token)
- `500` - Server error during migration

---

## Supabase Client API

All Supabase operations go through the client in `lib/supabase/client.ts`.

### Authentication

```typescript
import { supabase } from '@/lib/supabase/client'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

---

### Database Operations

#### User Profiles

```typescript
// Get user profile
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Create user profile
await supabase.from('user_profiles').insert({
  id: userId,
  email: userEmail,
  username: 'username',
})

// Update profile
await supabase.from('user_profiles')
  .update({ is_seller: true })
  .eq('id', userId)
```

#### Products

```typescript
// Get all active products
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('listing_date', { ascending: false })

// Get product by ID
const { data } = await supabase
  .from('products')
  .select('*, seller:user_profiles(*)')
  .eq('id', productId)
  .single()

// Create product
await supabase.from('products').insert({
  seller_id: userId,
  title: 'Product Name',
  description: 'Description',
  category: 'Knitting',
  price: 29.99,
  condition: 'new',
  quantity: 1,
  is_active: true,
})

// Update product
await supabase.from('products')
  .update({
    title: 'Updated Title',
    price: 39.99,
  })
  .eq('id', productId)

// Delete product
await supabase.from('products').delete().eq('id', productId)

// Search products
const { data } = await supabase
  .from('products')
  .select('*')
  .ilike('title', '%search_term%')
```

#### Cart Items

```typescript
// Get cart
const { data } = await supabase
  .from('cart_items')
  .select('*, product:products(*)')
  .eq('user_id', userId)

// Add to cart / update quantity
await supabase.from('cart_items').upsert({
  user_id: userId,
  product_id: productId,
  quantity: 2,
}, {
  onConflict: 'user_id,product_id'
})

// Remove from cart
await supabase.from('cart_items').delete().eq('id', cartItemId)

// Clear cart
await supabase.from('cart_items').delete().eq('user_id', userId)
```

#### Orders

```typescript
// Create order
const { data, error } = await supabase
  .from('orders')
  .insert({
    buyer_id: buyerId,
    seller_id: sellerId,
    product_id: productId,
    quantity: 1,
    total_price: 29.99,
    shipping_address: { /* address object */ },
    status: 'pending',
  })
  .select()

// Get buyer's orders
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('buyer_id', buyerId)
  .order('created_at', { ascending: false })

// Get seller's orders
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('seller_id', sellerId)
  .order('created_at', { ascending: false })

// Update order status
await supabase.from('orders')
  .update({ status: 'shipped' })
  .eq('id', orderId)

// Get order details
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single()
```

#### Reviews

```typescript
// Get product reviews
const { data } = await supabase
  .from('reviews')
  .select('*')
  .eq('reviewee_id', sellerId)
  .order('created_at', { ascending: false })

// Create review
await supabase.from('reviews').insert({
  order_id: orderId,
  reviewer_id: buyerId,
  reviewee_id: sellerId,
  rating: 5,
  comment: 'Great product!',
})
```

---

## Data Models

### User Profile
```typescript
interface UserProfile {
  id: string              // UUID
  email: string           // Unique email
  username?: string       // Optional username
  full_name?: string
  avatar_url?: string
  bio?: string
  location?: string
  is_seller: boolean      // Seller flag
  seller_verified: boolean
  verification_status: 'unverified' | 'pending' | 'verified'
  avg_rating?: number     // Average review rating
  total_sales: number
  total_reviews: number
  stripe_account_id?: string
  created_at: string      // ISO timestamp
  updated_at: string
}
```

### Product
```typescript
interface Product {
  id: string              // UUID
  seller_id: string       // Foreign key to user_profiles
  title: string
  description: string
  category: string        // 'Knitting', 'Painting', etc.
  subcategory?: string
  price: number           // Decimal (10,2)
  condition: 'new' | 'like-new' | 'used' | 'damaged'
  quantity: number        // Stock available
  images: string[]        // JSONB array of image URLs
  dimensions?: object
  weight?: number
  tags: string[]          // Array of tag strings
  is_active: boolean
  views_count: number
  listing_date: string    // ISO timestamp
  updated_at: string
  seller?: UserProfile    // Included with select('*, seller(...)')
}
```

### Order
```typescript
interface Order {
  id: string              // UUID
  buyer_id: string        // Foreign key to user_profiles
  seller_id: string       // Foreign key to user_profiles
  product_id: string      // Foreign key to products
  quantity: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' 
        | 'completed' | 'disputed' | 'refunded' | 'cancelled'
  total_price: number     // Decimal (10,2)
  shipping_address?: object
  tracking_number?: string
  stripe_payment_intent_id: string
  stripe_transfer_id?: string
  created_at: string      // ISO timestamp
  updated_at: string
}
```

### Cart Item
```typescript
interface CartItem {
  id: string              // UUID
  user_id: string         // Foreign key to user_profiles
  product_id: string      // Foreign key to products
  quantity: number
  product?: Product       // Included with select('*, product(...)')
  created_at: string      // ISO timestamp
  updated_at: string
}
```

### Review
```typescript
interface Review {
  id: string              // UUID
  order_id: string        // Foreign key to orders (unique)
  reviewer_id: string     // Buyer's user ID
  reviewee_id: string     // Seller's user ID
  rating: number          // 1-5
  comment?: string
  created_at: string      // ISO timestamp
  updated_at: string
}
```

---

## Error Handling

### Supabase Error Response
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')

if (error) {
  console.error('Error:', error.message)
  // error.code - error code string
  // error.message - human readable message
  // error.details - additional details
}
```

### Common Error Codes
- `PGRST301` - Row not found
- `42P01` - Table doesn't exist
- `23505` - Unique constraint violation
- `42703` - Column doesn't exist

---

## Row Level Security (RLS)

All tables have RLS policies. The app relies on Supabase auth context:

- `auth.uid()` - Get current user's ID
- `auth.jwt()` - Get JWT token
- `auth.jwt() ->> 'role'` - Get user role

See `/app/api/migrations/route.ts` for all RLS policies.

---

## Rate Limiting

Not currently implemented. For production:
- Consider API route middleware
- Supabase has built-in protection
- Implement per-IP rate limiting on key endpoints

---

## Pagination

For large result sets, use limit/offset:

```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .range(0, 19)  // Items 0-19 (first 20)
  .order('created_at', { ascending: false })
```

---

## Real-time Subscriptions

Not currently used, but available:

```typescript
const subscription = supabase
  .channel('products')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'products' },
    (payload) => {
      console.log('New product:', payload.new)
    }
  )
  .subscribe()
```

---

## Migration Endpoint Details

### What It Does
1. Creates UUID extension
2. Creates all 8 tables with proper constraints
3. Sets up indexes for performance
4. Configures RLS policies
5. Creates triggers for updated_at
6. Grants permissions to authenticated users

### Safe to Run Multiple Times
Yes - uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`

### Access Control
Protected with Bearer token in Authorization header - only run with correct `MIGRATION_SECRET_KEY`

---

## Best Practices

1. **Always check for errors**: Every Supabase operation can fail
2. **Use select() appropriately**: Only fetch columns you need
3. **Index on common filters**: Done in migrations already
4. **Use RLS**: Never rely on client-side security
5. **Validate input**: Always validate form data
6. **Type your data**: Use TypeScript interfaces
7. **Handle loading states**: Show UI feedback during operations
8. **Cache when possible**: Use React state/context for temporary data

---

## Debugging

### Check Supabase Console
- View real-time data changes
- Monitor RLS policy violations
- Check authentication logs

### Local Development
```bash
npm run dev
# Check browser console for errors
# Check terminal for server logs
```

### Production (Vercel)
- Check Vercel Deployments > Logs
- Monitor Supabase real-time dashboard
- Use browser DevTools Network tab

---

For more detailed information, see official documentation:
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
