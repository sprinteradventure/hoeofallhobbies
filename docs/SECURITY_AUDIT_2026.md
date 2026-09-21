# Security & Trust-and-Safety Audit - Hoe of All Hobbies marketplace
Stack: Next.js 14 (App Router, mostly client components) / Supabase Postgres + RLS / Stripe Connect (Express, destination charges) / Shippo.
Scope: all 16 migrations, middleware.ts, next.config.js, all 19 API routes, seller listing flows, admin pages, messaging, auth.

## WORST GAPS, RANKED BY RISK

### R1. All user PII readable by ANY logged-in user (RLS `USING (true)` on user_profiles)
- `supabase/migrations/002_rls_policies.sql:11-13` - "Public profiles are viewable by everyone": `FOR SELECT USING (true)`.
- `user_profiles` columns (001:6-23, plus 010:17-28, 012:9-10) include: `email`, `full_name`, `username`, `location`, `ship_name`, `ship_street1`, `ship_street2`, `ship_city`, `ship_state`, `ship_zip`, `ship_country`, `ship_phone`, `stripe_account_id`, `bio`.
- No column-level privileges; any authenticated session with the anon key can `select * from user_profiles` and harvest every member's home address, phone, and email. Enables doxxing, stalking, off-platform harassment, targeted phishing.
- Same pattern, lower severity: `reviews` SELECT `USING (true)` (002:79-81) and `products` SELECT `is_active = true OR seller` (002:25-27) - fine for a catalog, but not for profiles.

### R2. Fake-order -> fake-review integrity hole (RLS trusts client-supplied status/total)
- `002_rls_policies.sql:69-76` - orders INSERT `WITH CHECK (auth.uid() = buyer_id)` only: no constraint on `status`, `total_price`, `seller_id`. Any authenticated user can insert an order with `status='completed'` via the anon key.
- `003_order_items.sql:42-50` - buyers can add line items to their own orders.
- `007_moderation.sql:55-68` - review-safeguard policy only checks an order exists with `buyer_id = auth.uid()` and status in ('paid','shipped','delivered','completed') with a line item.
- Chain: insert fake order (status 'completed') -> insert order_items -> insert 5-star (or 1-star) review for ANY seller. Review fraud, extortion, reputation laundering - from a fresh account.
- Orders UPDATE policy (002:73-76) lets EITHER party set ANY status with no state machine; `shipping_address` is UPDATE-able by either party post-payment - a buyer can change the delivery address after the label is purchased.

### R3. Zero content moderation at listing creation (client-side insert, no validation layer)
- `app/seller/listings/new/page.tsx:187-213` - insert goes straight from the browser through the anon key to `products`. No server route, no zod schema, no banned-word/prohibited-item screening, no image-count cap, no rate limit, no price sanity check (only HTML `min="0"`; DB has `price DECIMAL(10,2) NOT NULL` with NO CHECK (price > 0), 001:33).
- `002_rls_policies.sql:29-31` - INSERT policy only checks `auth.uid() = seller_id`; it does NOT require `is_seller = true` or any verification. The Stripe-payout gate in the UI (new/page.tsx:144, 173-178, 565) is client-side only and bypassable with a direct insert.
- Net effect: any confirmed account can publish arbitrary text/images (drugs, weapons, counterfeit, adult content) as public listings. Mitigations: (a) purchases require Stripe Express KYC passed (checkout 409-gates on `stripe_payouts_enabled`, checkout route.ts:144-165) so scam listings cannot receive money until KYC'd; (b) the report flow. Prohibited content stays public until reported.

### R4. No escrow / immediate seller settlement + no refund-abuse controls
- `app/api/checkout/route.ts:384-387` - destination charge with `transfer_data.destination` transfers 95% to the seller's Express account AT CHARGE TIME. No hold/escrow; if the seller never ships, recovery depends entirely on Stripe disputes.
- No refund code path exists anywhere (no `stripe.refunds.create`, no dispute endpoint). Order status 'refunded' is settable by either party via RLS (002:73-76) with no Stripe call - cosmetic and desynced from reality.
- `checkout.session.completed` webhook (webhooks/stripe/route.ts:49-127) flips orders to 'paid' from `metadata.order_ids` WITHOUT verifying paid amount vs order totals (defense-in-depth only: sessions are created server-side).

### R5. Messaging has proper RLS but zero abuse controls
- Good: `013_messaging.sql:78-131` - conversations/messages locked to participants; API re-checks participant status server-side (`conversations/[id]/route.ts:35-50`).
- Gaps:
  - No rate limiting - a script can DM-blast every seller (one conversation per listing, conversations POST route.ts:30-92) and spam 2000-char messages indefinitely.
  - No content filtering - nothing detects "email me, pay via Venmo" (off-platform redirection), harassment, or scams in message bodies.
  - No blocking - a recipient cannot block a sender.
  - Cannot report a user: `reports` schema supports `reported_user_id` (007:15) but `app/api/reports/route.ts:37-47` only accepts `product_id`; no user/message-report API or UI. Harassment via messages is unreportable.
  - Email notification throttle (014) is per-thread, not anti-spam.

### R6. No rate limiting / CAPTCHA anywhere
- `middleware.ts:10-28` only sets a `site-type` cookie/header; it gates NOTHING (no auth checks, no throttling; matcher even excludes `/api`, line 39).
- No rate-limit/upstash/token-bucket code anywhere in `app/api/**` (grep confirms). Signup, login, reports, messages, uploads, and shipping-rates (paid Shippo API call per request, `shipping/rates/route.ts:132-156`) are all unthrottled.
- Signup has no CAPTCHA (SignupForm.tsx:30-37). Password policy is client-side `minLength={8}` only (SignupForm.tsx:108).

### R7. Admin surface relies solely on an env allowlist; no audit trail is ever written
- `lib/supabase/admin.ts:31-47` - admin = email in `ADMIN_EMAILS`; all `/api/admin/*` routes enforce it (correct pattern). But `/admin/**` pages are client components behind a PASS-THROUGH layout (`app/admin/layout.tsx:9-11`) - no server-side gating; security depends on every API route remembering the check (they currently do, including `/api/orders/[id]/label` fallback, label route.ts:51-59).
- `audit_logs` table exists (001:121-131) with admin-only SELECT policy (002:93-97) but ZERO writers: no triggers, no inserts anywhere in migrations or app code. Moderation actions (ban/takedown) leave no trail.

### R8. Storage/upload abuse vectors
- `app/api/upload/sign/route.ts:121-124` - signed upload URLs minted server-side (good: path forced under `<user_id>/`, fileName shape-validated :107-119) but the actual PUT is direct-to-Storage with NO server-side size cap (the 10 MB limit in `app/api/upload/route.ts:20, 93-98` applies only to the proxied route, which ImageUploader bypasses). A seller can PUT multi-GB objects to the public `product-images` bucket and run up the Storage bill. No per-user quotas.
- `components/ImageUploader.tsx:74-80` (`addUrl`) lets sellers paste ARBITRARY external image URLs into `products.images` (JSONB), bypassing upload validation; rendered via `next/image` with a permissive allowlist (`next.config.js:3-15`).

### R9. Auth/session weaknesses
- No `lib/supabase/server.ts` - no cookie-based server session; EVERY page is a client component doing `supabase.auth.getUser()` in `useEffect` then client-side fetches. Route protection (seller, account, admin UI) is client-side redirects only; the real boundary is RLS/API checks (they hold, except R1/R2).
- `app/auth/callback/page.tsx:9-12` - the email-confirmation landing page NEVER exchanges the `?code=` for a session (no `exchangeCodeForSession`); it just redirects home. Functional bug with security side-effects.
- Email confirmation is enabled (per `008_profile_trigger.sql:4-7`) - a real anti-abuse gate; keep it on.
- No 2FA, no server password-strength policy, no session/device management. Account-takeover protection is purely Supabase defaults.

## DETAILED ANSWERS

### 1. RLS policy inventory
- user_profiles: SELECT `USING(true)`; UPDATE/INSERT own. R1: all PII to any authenticated user.
- products: SELECT active-or-own; INSERT/UPDATE/DELETE own. INSERT does not require `is_seller` (R3).
- cart_items: full own-row. OK.
- orders: SELECT buyer/seller; INSERT buyer; UPDATE either party. NO status/state/column restrictions (R2).
- order_items: SELECT/INSERT via order ownership. OK, but feeds the fake-review chain (R2).
- reviews: SELECT all; INSERT verified-purchase (007). Bypassable via fake order (R2).
- seller_payouts: SELECT own. OK (writes are server-only by absence of policy).
- promo_codes: active SELECT for all incl. anon; admin-only writes (005). Fixed from earlier world-writable state.
- audit_logs: admin SELECT only. NOTHING writes to it (R7).
- reports: INSERT own, SELECT own (007); admin via service role only.
- conversations/messages: participants only (013). Solid.
- collectible_subcategories: created lazily with public SELECT / authenticated INSERT (`categories/custom-subcategories/route.ts:125-146`); insert any name, no length limit; table creation relies on a likely-nonexistent `exec_sql` RPC.
- Tables without any policy/RLS: none among the core 12 (all have RLS enabled). Storage bucket `product-images` is public-read, service-role writes only (no Storage RLS policies defined).

### 2. PII stored & who can read it
- user_profiles: email, full_name, username, bio, location, full ship-from address (name/street/city/state/ZIP/country), ship_phone, stripe_account_id (001 + 010 + 012). Readable by EVERY authenticated user (R1).
- orders.shipping_address JSONB: buyer name/street/city/state/ZIP/phone (written by checkout route.ts:84-96). Readable by buyer and seller (002:61-67) - appropriate - but UPDATE-able by either party (002:73-76): buyer can rewrite the delivery address post-payment (R2).
- messages bodies: participants only (013) - OK; no PII redaction in email-notification snippets (up to 140 chars of body sent, `conversations/[id]/route.ts:193-203`).
- Conversation API embeds the other party's `email` in the fetched profile join (`conversations/[id]/route.ts:41-42`); the response builder uses display fields, but the raw object is not stripped - latent leak.

### 3. Listing creation flow
- Browser -> anon key -> `products` direct insert (new/page.tsx:187-213). Only validation: HTML `required`/`min` attributes. zod is used in messaging but NO validation schema exists for listings (`lib/validations` does not exist).
- No banned-word/prohibited-item check, no image-count cap, no daily listing cap, no new-account delay, no price>0 enforcement.
- Effective gate: UI requires Stripe payouts enabled (new/page.tsx:144, 565) - but CLIENT-SIDE only; the RLS INSERT policy (002:29-31) accepts any authenticated user. A determined abuser lists without KYC; they just cannot get paid (checkout blocks on `stripe_payouts_enabled`, checkout route.ts:153-165).

### 4. Messaging
- RLS: participants only (013:78-131); API double-checks participant server-side (`[id]/route.ts:35-50`). Good.
- No rate limit, no blocking, no content filter (R5). Strangers can DM any seller about any listing (conversations POST only requires the product to exist, route.ts:46-60) - normal for marketplaces, but with no blocking/filtering it is a harassment/spam vector. Off-platform payment redirection is undetected and unreportable.

### 5. Report/flag flow
- UI: "Report this listing" modal on product pages (`ProductDetailClient.tsx:342-348, 510-570`) -> `POST /api/reports` (validated reasons, own-listing blocked, one open report per reporter/product, route.ts:42-81). Good dedupe.
- `/admin/moderation` is FUNCTIONAL: queue UI backed by `/api/admin/reports` + `/api/admin/reports/[id]/action` with actions: deactivate/reactivate/delete listing, BAN SELLER (`auth.admin.updateUserById` ban 876000h + deactivate all listings, action route.ts:154-168), unban, resolve/dismiss with admin notes. Authorization via `ADMIN_EMAILS` allowlist (admin.ts:40-46).
- Gaps: user/message reporting unreachable (R5); no shadowban/listing-hold state; no auto-takedown at N reports; moderation actions unlogged (R7).

### 6. Payments
- Webhook signature verified properly (`constructEvent`, webhooks/stripe/route.ts:41-47). Events handled: `checkout.session.completed`, `account.updated`.
- Prices are SERVER-DERIVED: cart + product prices loaded server-side (checkout route.ts:99-107); line items built from DB prices (:353-359); shipping rate re-verified against Shippo and address-matched (:194-218). Client price manipulation is not possible.
- Stock decremented atomically via SECURITY DEFINER RPC with oversell guard (003:58-75; checkout :250-265).
- No escrow/hold - 95% settles to seller at capture (R4). No refund endpoint, no dispute handling beyond Stripe chargebacks.
- Platform fee math consistent (5% of subtotal + shipping; :334-340, clamped).

### 7. Auth
- Email confirmation: enabled (per 008 comments + verify-email flow). Keep it - main signup-abuse brake.
- Password: client `minLength=8` only; no server-side policy, no breach-list check, no CAPTCHA.
- Sessions: client-side (localStorage via supabase-js) only; no server component auth checks anywhere - all "protected" pages are client redirects after mount. RLS is the real boundary; it holds except R1/R2.
- Admin: token validated against `ADMIN_EMAILS` (admin.ts:31-47); empty allowlist means no admins (:45).

### 8. Service-role API routes - authorization review
All routes use `getSupabaseAdmin()`; every audited route validates the Bearer token via `admin.auth.getUser`:
- checkout (route.ts:48-58), stripe webhook (signature, :35-47), reports (reports/route.ts:22-35), admin reports/sellers/verify/stats/me (403 via allowlist), orders/[id]/label (seller-or-admin, label route.ts:50-59), messages (`getUserFromRequest`, messages/auth.ts:8-16), upload + upload/sign (sellers only), seller/shipping (self-only, .eq('id', user.id) :94-97), connect/onboard (self-only), shipping/rates (any authenticated user; calls paid Shippo API with arbitrary seller_id - cost-abuse vector, R6), categories/custom-subcategories GET (NO auth at all, public read).
- IDOR check: no route fetches/updates by id without an ownership check. The IDOR risk lives in RLS itself (orders UPDATE/INSERT, R2), reachable via the anon key without any API route.

### 9. Audit logging
- `audit_logs` table + admin SELECT policy exist (001:121-131, 002:93-97) but NO code path ever inserts - no DB triggers, no API writes. Ban/takedown/payout events unlogged (console only). Dead table.

### 10. Middleware
- Only reads `host`, sets `site-type` cookie + `x-site-type` header (middleware.ts:10-28) for the two-marketplace split (016). Blocks nothing; matcher excludes `/api`, `_next/*`, metadata files (:30-40). No auth, no CSRF, no security headers (no CSP/X-Frame-Options in next.config.js - defaults only).

## RECOMMENDED FIX PRIORITY
1. Replace profiles SELECT `USING(true)` with a safe view/columns (public: username, avatar, rating; owner-only for ship_*/email) - fixes R1.
2. Lock down orders: INSERT restricted to service role only (checkout already uses service role; add `WITH CHECK (false)` for authenticated), add a status state-machine trigger, restrict buyer UPDATE to a `disputed` flag - fixes R2 (fake orders/reviews, address rewrite, status vandalism).
3. Move listing creation behind a server route with zod validation, banned-word/prohibited-item screening, price>0, image-count caps, per-day listing quotas - fixes R3.
4. Add rate limiting (e.g. Upstash) on /api/reports, /api/messages/*, /api/shipping/rates, auth endpoints; add CAPTCHA to signup - fixes R5/R6.
5. Extend reports to `reported_user_id` + message reporting; add a user block table - fixes the harassment blind spot.
6. Write a moderation_actions/audit_logs insert in the admin action route - fixes R7.
7. Enforce upload size server-side (Storage policies or proxy check); drop arbitrary image-URL paste - fixes R8.
8. Fix /auth/callback to call `exchangeCodeForSession` - fixes broken confirmation flow.
9. Consider Stripe `manual_capture` (7-day hold) for new/unproven sellers - mitigates R4.
