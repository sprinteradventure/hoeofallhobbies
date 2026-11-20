-- 020_digital_products.sql
-- Support digital template / downloadable listings.
-- Sellers can list a digital product, upload a file (PDF / ZIP / image template)
-- to the private `digital-files` bucket, and buyers download it instantly after
-- payment through a signed-URL route (no shipping involved).

alter table public.products
  add column if not exists product_type text not null default 'physical'
    check (product_type in ('physical', 'digital'));

alter table public.products
  add column if not exists digital_file_path text;

-- Storage bucket for digital downloads. PRIVATE — files are served only through
-- /api/downloads/[productId] after the buyer's paid order is verified.
insert into storage.buckets (id, name, public)
values ('digital-files', 'digital-files', false)
on conflict (id) do nothing;

-- Sellers can upload/replace/delete their own digital files.
create policy if not exists "Sellers manage own digital files"
  on storage.objects for all
  using (
    bucket_id = 'digital-files'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'digital-files'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role (used by the signed download route) bypasses RLS, so no select
-- policy is needed for buyers.
