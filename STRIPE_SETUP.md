# Stripe Setup — Exact Steps for Tonight

The code is prepared for Stripe but runs in the current "pending order" mode
until you add the keys. Nothing payments-related changes until you do.

## 1. Add these env vars in Vercel (Project → Settings → Environment Variables)

| Variable | Where to get it | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → **Secret key** (`sk_live_...`, or `sk_test_...` while testing) | Server-only, never expose |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same page → **Publishable key** (`pk_live_...` / `pk_test_...`) | Safe for the browser |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → add endpoint (step 2 below) → **Signing secret** (`whsec_...`) | Server-only |
| `NEXT_PUBLIC_APP_URL` | Already set — make sure it is your production URL, e.g. `https://hoe-of-all-hobbies.vercel.app` (or the custom domain once connected) | Used for Stripe success/cancel URLs and auth redirects |

Also confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (the checkout API,
webhook, and admin stats route all use it). **Rotate it first** — the old one
was committed to the repo (see the audit report).

## 2. Create the webhook endpoint in Stripe

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:

- **URL:** `https://<your-domain>/api/webhooks/stripe`
- **Events:** `checkout.session.completed`

Copy the endpoint's **Signing secret** into `STRIPE_WEBHOOK_SECRET` in Vercel.

## 3. Apply the new database migrations (Supabase SQL editor)

Run these two files in order:

1. `supabase/migrations/003_order_items.sql` — order line items + stock decrement
2. `supabase/migrations/004_payment_pending_status.sql` — adds the `payment_pending` order status

## 4. Activate the Stripe checkout flow

Search the codebase for `TODO(owner)` / `TODO(stripe)`:

- `app/api/checkout/route.ts` — uncomment the Stripe Checkout Session block
  (it creates orders as `payment_pending` and returns the Stripe session URL).
- `app/shop/checkout/page.tsx` — switch the Place Order button to POST to
  `/api/checkout` (with the user's access token) and redirect to the returned
  Stripe URL, instead of inserting orders directly.
- `app/api/webhooks/stripe/route.ts` — already live; it flips orders to
  `paid` once the webhook secret is set.

**Do not** add any platform-fee / commission split in Stripe code — the
commission rate is still an open owner decision (5% vs 20%).
