-- 016: Per-site product segregation (hoeofallhobbies.com vs hoeofallholidays.com)
-- Adds a `site` column to products tagging which marketplace each listing
-- belongs to. Existing rows are backfilled from their category: listings in
-- the old 'Seasonal Crafts & Decor' and 'Party & Celebrations' categories
-- move to 'holidays'; everything else stays 'hobbies'.
-- New listings set the column from the app (middleware detects the host).
-- Idempotent: safe to re-run.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS site TEXT NOT NULL DEFAULT 'hobbies'
  CHECK (site IN ('hobbies', 'holidays'));

-- Index for the hot path: per-site browsable catalog
CREATE INDEX IF NOT EXISTS idx_products_site ON public.products(site, is_active, listing_date DESC);

-- Backfill legacy holiday/party listings to the holidays marketplace
UPDATE public.products
SET site = 'holidays'
WHERE site = 'hobbies'
  AND (
    category IN ('Seasonal Crafts & Decor', 'Party & Celebrations')
    OR categories && ARRAY['Seasonal Crafts & Decor', 'Party & Celebrations']::text[]
  );
