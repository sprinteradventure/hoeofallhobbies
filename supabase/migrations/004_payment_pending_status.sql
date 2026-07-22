-- 004: Add 'payment_pending' order status for the upcoming Stripe checkout
-- flow. Orders created via /api/checkout start as 'payment_pending' and the
-- Stripe webhook flips them to 'paid' on checkout.session.completed.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'payment_pending',
    'paid',
    'shipped',
    'delivered',
    'completed',
    'disputed',
    'refunded',
    'cancelled'
  ));
