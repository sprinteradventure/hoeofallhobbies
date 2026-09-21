-- 017: Security hardening — Wave 1 (see docs/SECURITY_AUDIT_2026.md)
--
--   R1  PII lockdown on user_profiles via column-level privileges.
--   R2  Orders/order_items write lockdown + orders status state-machine trigger.
--   R5  reports: message_id / conversation_id context columns.
--   R3  products price floor CHECK constraint.
--
-- Run AFTER 001-016 in the Supabase SQL editor. Idempotent-ish: safe to re-run.

-- ---------------------------------------------------------------------------
-- R1: user_profiles PII lockdown.
--
-- 001 granted ALL PRIVILEGES (incl. SELECT on every column) to authenticated,
-- and the 002 SELECT policy is USING (true) — so any logged-in user could
-- read email, full_name, location, ship_* address columns, ship_phone and
-- stripe_account_id. Column privileges COMPOSE with RLS in Postgres: the
-- existing row policy stays in place, and both must pass. Only the safe,
-- non-PII columns the app's client-side code actually selects are re-granted.
-- Server-side code uses the service-role key and is unaffected by this.
-- ---------------------------------------------------------------------------
REVOKE SELECT ON public.user_profiles FROM authenticated, anon;

GRANT SELECT (
  id,
  username,
  avatar_url,
  bio,
  seller_name,
  is_seller,
  seller_verified,
  avg_rating,
  total_reviews,
  total_sales,
  stripe_payouts_enabled,
  message_email_notifications,
  created_at
) ON public.user_profiles TO authenticated, anon;

-- (UPDATE remains granted from 001 — users edit their own seller_name /
-- notification prefs / is_seller flag through the app, gated by RLS.)

-- ---------------------------------------------------------------------------
-- R2: orders / order_items write lockdown.
--
-- Checkout is fully server-side via the service role, so clients never need
-- to INSERT or UPDATE orders; verified greps confirm no legitimate client
-- writes to order_items either (checkout + webhook write via service role).
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.orders FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM authenticated, anon;

-- Status state machine + immutable financial/identity columns. The service
-- role (checkout, Stripe webhook, seller status API) bypasses entirely. Any
-- other role may ONLY move status 'paid' -> 'shipped' (seller marking an
-- order shipped) and may NEVER change buyer_id, seller_id, product_id,
-- total_price or shipping_address after insert. In practice authenticated
-- has no UPDATE privilege at all after the REVOKE above — this trigger is
-- defense-in-depth should the grant ever be restored.
CREATE OR REPLACE FUNCTION public.orders_status_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Immutable once the order exists.
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id
     OR NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.shipping_address IS DISTINCT FROM OLD.shipping_address THEN
    RAISE EXCEPTION 'orders: buyer_id, seller_id, product_id, total_price and shipping_address are immutable';
  END IF;

  -- Only allowed non-service-role transition: seller ships a paid order.
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NOT (OLD.status = 'paid' AND NEW.status = 'shipped') THEN
    RAISE EXCEPTION 'orders: invalid status transition % -> %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_status_guard ON public.orders;
CREATE TRIGGER orders_status_guard
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_status_guard();

-- ---------------------------------------------------------------------------
-- R5: reports — optional message/conversation context for user reports.
-- ---------------------------------------------------------------------------
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- R3: products price floor. NOT VALID so the migration cannot fail on any
-- pre-existing zero-price row; the check still applies to all new/updated
-- rows (Postgres enforces NOT VALID constraints on new rows).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_price_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_check CHECK (price >= 0.01) NOT VALID;
  END IF;
END $$;
