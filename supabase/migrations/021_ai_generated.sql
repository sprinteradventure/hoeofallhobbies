-- 021_ai_generated.sql
-- AI-content disclosure + buyer opt-out.
-- Per the Terms of Service, sellers must disclose AI-generated content.
-- This flag powers that labeling on listings and the "hide AI-generated
-- items" filter in browse/search. Default false = existing listings are
-- treated as non-AI until the seller updates them.

alter table public.products
  add column if not exists ai_generated boolean not null default false;
