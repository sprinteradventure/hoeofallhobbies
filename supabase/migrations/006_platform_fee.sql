-- 006: Platform fee bookkeeping on orders
-- 5% commission on each order's total_price, recorded at checkout time by
-- /api/checkout. Payments settle into the platform's Stripe account (no
-- Stripe Connect); sellers are paid out manually.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2);
