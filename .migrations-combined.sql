-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Profile Table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  seller_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  avg_rating DECIMAL(3,2),
  total_sales INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  price DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'used' CHECK (condition IN ('new', 'like-new', 'used', 'damaged')),
  quantity INTEGER DEFAULT 1,
  images JSONB DEFAULT '[]'::jsonb,
  dimensions JSONB,
  weight DECIMAL(8,2),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  listing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
  ) STORED
);

-- Create indexes for products
CREATE INDEX idx_products_seller_id ON public.products(seller_id, is_active);
CREATE INDEX idx_products_category ON public.products(category, is_active);
CREATE INDEX idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_listing_date ON public.products(listing_date DESC);

-- Cart Items Table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
  total_price DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  tracking_number TEXT,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Reviews Table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE UNIQUE,
  reviewer_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Seller Payouts Table
CREATE TABLE public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.user_profiles ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  amount DECIMAL(10,2) NOT NULL,
  payout_date TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payouts_seller_id ON public.seller_payouts(seller_id);
CREATE INDEX idx_payouts_status ON public.seller_payouts(status);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES public.user_profiles ON DELETE SET NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Promo Codes Table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount DECIMAL(10,2),
  min_order_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE reviewee_id = user_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = user_id
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product views
CREATE OR REPLACE FUNCTION increment_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products SET views_count = views_count + 1 WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON public.user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.products TO authenticated;
GRANT ALL PRIVILEGES ON public.cart_items TO authenticated;
GRANT ALL PRIVILEGES ON public.orders TO authenticated;
GRANT ALL PRIVILEGES ON public.reviews TO authenticated;
GRANT ALL PRIVILEGES ON public.seller_payouts TO authenticated;
GRANT SELECT ON public.promo_codes TO authenticated;


-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Products Policies
CREATE POLICY "Active products are viewable by everyone"
  ON public.products FOR SELECT
  USING (is_active = true OR auth.uid() = seller_id);

CREATE POLICY "Sellers can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- Cart Items Policies
CREATE POLICY "Users can view their own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Buyers can view their own orders as buyer"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their own orders as seller"
  ON public.orders FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Both parties can update orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Buyers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Seller Payouts Policies
CREATE POLICY "Sellers can view their own payouts"
  ON public.seller_payouts FOR SELECT
  USING (auth.uid() = seller_id);

-- Audit Logs Policies
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );
