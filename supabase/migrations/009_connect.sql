-- 009: Stripe Connect (Express) — automatic 95/5 splits
-- Sellers onboard onto Stripe Express accounts; checkout then creates
-- destination charges (95% to the seller's connected account, 5% platform
-- fee via application_fee_amount). These columns track each seller's
-- connected account and onboarding/payout status on their profile.
--
-- Idempotent: safe to re-run (stripe_account_id already exists in 001's
-- schema, so ADD COLUMN IF NOT EXISTS covers both fresh and existing DBs;
-- uniqueness is enforced with a CREATE UNIQUE INDEX IF NOT EXISTS).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;

-- One Stripe account per seller (NULLs are allowed and not considered equal).
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_stripe_account_id
  ON public.user_profiles (stripe_account_id);
