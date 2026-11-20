-- 018: Seller shops (public storefronts) + seller-issued coupon codes.
--
-- Shops give every seller a branded storefront at /shops/<slug> with a
-- banner, story, announcement bar, and social links — the "set up a shop and
-- sell from it" layer on top of the existing listings/orders/payouts flow.
--
-- Coupons let a seller issue shareable discount codes for their own shop.
-- Validation happens server-side in /api/checkout (service role), so this
-- table has no public SELECT policy — buyers never read codes directly.
--
-- Run order: safe to apply at any time; nothing in migrations 001-017
-- depends on these tables. The app tolerates their absence until applied
-- (feature-flagged by a lightweight probe on the seller side).

-- ── Shops ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shops (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  tagline      text,
  story        text,
  banner_url   text,
  avatar_url   text,
  announcement text,
  location     text,
  website_url  text,
  instagram_url text,
  pinterest_url text,
  facebook_url text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shops_seller_idx ON public.shops (seller_id);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Storefronts are public read (they exist to be shared).
CREATE POLICY "shops_select_public"
  ON public.shops FOR SELECT
  USING (true);

-- A signed-in user may create exactly one shop (seller_id UNIQUE backs this).
CREATE POLICY "shops_insert_own"
  ON public.shops FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Only the owner may edit their shop.
CREATE POLICY "shops_update_own"
  ON public.shops FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Only the owner may delete their shop.
CREATE POLICY "shops_delete_own"
  ON public.shops FOR DELETE
  USING (seller_id = auth.uid());

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.touch_shops_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_touch_updated_at ON public.shops;
CREATE TRIGGER shops_touch_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.touch_shops_updated_at();

-- ── Seller coupons ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code            text NOT NULL,
  percent_off     integer NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  max_uses        integer CHECK (max_uses IS NULL OR max_uses > 0),
  used_count      integer NOT NULL DEFAULT 0,
  expires_at      timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, code)
);

CREATE INDEX IF NOT EXISTS seller_coupons_seller_idx ON public.seller_coupons (seller_id);

ALTER TABLE public.seller_coupons ENABLE ROW LEVEL SECURITY;

-- No public SELECT: code validation runs server-side via service role in
-- /api/checkout, so codes can't be enumerated with the anon key.

-- Sellers manage only their own coupons.
CREATE POLICY "seller_coupons_insert_own"
  ON public.seller_coupons FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "seller_coupons_select_own"
  ON public.seller_coupons FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "seller_coupons_update_own"
  ON public.seller_coupons FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "seller_coupons_delete_own"
  ON public.seller_coupons FOR DELETE
  USING (seller_id = auth.uid());

-- Order rows record which seller coupon (if any) was applied, so sellers can
-- see what worked and support can audit discounts.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

-- Atomic redemption counter, called from the Stripe webhook (service role)
-- on checkout.session.completed. Returns true while the coupon still had
-- headroom — a false return means max_uses was already exhausted and the
-- redemption should not be counted (checkout validation normally prevents
-- this; the guard covers concurrent checkouts racing the last use).
CREATE OR REPLACE FUNCTION public.redeem_seller_coupon(p_coupon_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ok boolean;
BEGIN
  UPDATE public.seller_coupons
     SET used_count = used_count + 1
   WHERE id = p_coupon_id
     AND is_active = true
     AND (max_uses IS NULL OR used_count < max_uses);
  ok := FOUND;
  RETURN ok;
END;
$$;
