-- 012: Seller ship-from phone (USPS label requirement)
-- Shippo/USPS rejects label creation unless the from-address carries an
-- email or phone ("Seller info missing email or phone"). The seller's email
-- comes from their account (user_profiles.email already exists); their
-- phone needs this new nullable column, set from /seller/shipping.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ship_phone text;
