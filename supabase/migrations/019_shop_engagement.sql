-- 019: Shop engagement — follows, saves, shop posts, featured products.
--
-- Inspired by seller-first marketplaces where the shopper relationship belongs
-- to the seller: buyers follow shops and save items, sellers publish updates
-- to their storefront, and pick featured listings.
--
-- All tables tolerate absence: the app feature-detects and hides sections
-- until this migration is applied.

-- ── Shop follows ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug   text NOT NULL,          -- storefront slug (stable across shop edits)
  seller_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_slug, follower_id)
);

CREATE INDEX IF NOT EXISTS shop_follows_seller_idx ON public.shop_follows (seller_id);
CREATE INDEX IF NOT EXISTS shop_follows_slug_idx ON public.shop_follows (shop_slug);

ALTER TABLE public.shop_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_follows_select_own"
  ON public.shop_follows FOR SELECT
  USING (follower_id = auth.uid());

CREATE POLICY "shop_follows_insert_own"
  ON public.shop_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "shop_follows_delete_own"
  ON public.shop_follows FOR DELETE
  USING (follower_id = auth.uid());

-- ── Product saves ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS product_saves_user_idx ON public.product_saves (user_id);
CREATE INDEX IF NOT EXISTS product_saves_product_idx ON public.product_saves (product_id);

ALTER TABLE public.product_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_saves_select_own"
  ON public.product_saves FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "product_saves_insert_own"
  ON public.product_saves FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "product_saves_delete_own"
  ON public.product_saves FOR DELETE
  USING (user_id = auth.uid());

-- ── Shop posts (maker updates) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_posts_seller_idx ON public.shop_posts (seller_id, created_at DESC);

ALTER TABLE public.shop_posts ENABLE ROW LEVEL SECURITY;

-- Storefront updates are public read.
CREATE POLICY "shop_posts_select_public"
  ON public.shop_posts FOR SELECT
  USING (true);

CREATE POLICY "shop_posts_insert_own"
  ON public.shop_posts FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "shop_posts_delete_own"
  ON public.shop_posts FOR DELETE
  USING (seller_id = auth.uid());

-- ── Featured products on the storefront ─────────────────────────────────────
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS featured_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
