-- 010: Shipping — Shippo real rates + automatic labels
-- Adds per-product parcel overrides (weight/dimensions), seller ship-from
-- addresses + default parcels on user_profiles, and Shippo/label bookkeeping
-- on orders. All new columns are nullable (ship_country has a default), so
-- existing rows keep working untouched.
--
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS throughout).

-- Products: parcel overrides (fall back to the seller's default parcel).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_oz numeric,
  ADD COLUMN IF NOT EXISTS length_in numeric,
  ADD COLUMN IF NOT EXISTS width_in numeric,
  ADD COLUMN IF NOT EXISTS height_in numeric;

-- User profiles: buyer/seller shipping address + seller default parcel.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ship_name text,
  ADD COLUMN IF NOT EXISTS ship_street1 text,
  ADD COLUMN IF NOT EXISTS ship_street2 text,
  ADD COLUMN IF NOT EXISTS ship_city text,
  ADD COLUMN IF NOT EXISTS ship_state text,
  ADD COLUMN IF NOT EXISTS ship_zip text,
  ADD COLUMN IF NOT EXISTS ship_country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS default_length_in numeric,
  ADD COLUMN IF NOT EXISTS default_width_in numeric,
  ADD COLUMN IF NOT EXISTS default_height_in numeric,
  ADD COLUMN IF NOT EXISTS default_weight_oz numeric;

-- Orders: what the buyer paid for shipping + Shippo label bookkeeping.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cost numeric,
  ADD COLUMN IF NOT EXISTS shipping_service_level text,
  ADD COLUMN IF NOT EXISTS shippo_shipment_id text,
  ADD COLUMN IF NOT EXISTS shippo_rate_id text,
  ADD COLUMN IF NOT EXISTS shippo_transaction_id text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS tracking_url text;
-- tracking_number already exists on orders (001).
