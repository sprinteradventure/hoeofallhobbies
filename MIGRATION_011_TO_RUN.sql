-- 011: Multi-category listings + listing video
-- Adds array columns carrying a listing's FULL category/subcategory selection
-- and an optional short-video URL. The legacy single-value `category` /
-- `subcategory` columns stay populated (first selection) so all existing
-- shop filters, search, breadcrumbs, and old rows keep working untouched.
-- All new columns are nullable; existing rows are unaffected.
--
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS throughout).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categories text[],
  ADD COLUMN IF NOT EXISTS subcategories text[],
  ADD COLUMN IF NOT EXISTS video_url text;
