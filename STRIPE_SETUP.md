# Stripe Payments — Status: LIVE

Stripe checkout is **active**. Setup was completed 2026-06 (keys configured in
Vercel for production + preview, webhook created).

## What's live

- **Checkout** — `app/shop/checkout/page.tsx` POSTs to `/api/checkout`, which
  authenticates the buyer, loads the cart **server-side** (client prices are
  never trusted), atomically decrements stock, creates one order per seller
  with status `payment_pending` plus `order_items` rows, then returns a
  Stripe-hosted Checkout URL the browser redirects to.
- **Webhook** — `app/api/webhooks/stripe/route.ts` at
  `https://hoe-of-all-hobbies.vercel.app/api/webhooks/stripe`, listening for
  `checkout.session.completed`. On payment it verifies the Stripe signature,
  flips the order(s) to `paid`, records the payment intent, and clears the
  buyer's cart.
- **Commission** — 5% platform fee is stored on each order in
  `orders.platform_fee` (migration `006_platform_fee.sql`) for bookkeeping.
  All payments settle into the platform's Stripe account (no Stripe Connect);
  sellers are paid out manually later.
- **Env vars** (all read from `process.env`, never hardcoded):
  `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- **Success / cancel URLs** — success: `/shop/orders?session_id=...`,
  cancel: `/shop/cart`.

## Remaining owner actions

1. **Complete Stripe account review/activation** in the Stripe dashboard so
   live-mode payouts are enabled (business details, bank account).
2. **Test a real purchase end-to-end** on production: signup → add to cart →
   checkout → pay (use Stripe's test card 4242 4242 4242 4242 in test mode,
   or a small live charge you refund) → confirm the order shows `paid` in
   `/shop/orders` and the Stripe dashboard.
3. **Apply migration 006** (`supabase/migrations/006_platform_fee.sql`) in the
   Supabase SQL editor if not already applied — checkout inserts
   `platform_fee` and will fail without the column.
4. Confirm `NEXT_PUBLIC_APP_URL` in Vercel matches the production domain so
   Stripe success/cancel redirects land correctly (code falls back to
   `https://hoe-of-all-hobbies.vercel.app`).

## Notes

- Buyers who abandon the Stripe-hosted checkout leave orders in
  `payment_pending` with stock already decremented; a future cleanup job can
  cancel stale `payment_pending` orders and restore stock.
- If `STRIPE_SECRET_KEY` is ever missing, `/api/checkout` returns 501
  `STRIPE_NOT_CONFIGURED` and the buyer sees a graceful "payments are being
  set up" message.
