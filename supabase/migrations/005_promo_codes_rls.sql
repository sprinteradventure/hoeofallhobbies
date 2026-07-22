-- 005: Enable Row Level Security on promo_codes
-- Audit finding: promo_codes had RLS disabled, making it world-readable/writable
-- with the public anon key.

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) may read active promo codes so the
-- checkout flow can validate a code. Adjust the USING clause if codes should
-- only be visible to logged-in users.
CREATE POLICY "promo_codes_select_active"
  ON public.promo_codes
  FOR SELECT
  USING (is_active = true);

-- Only admins (JWT app_metadata role = 'admin') may create codes.
CREATE POLICY "promo_codes_insert_admin"
  ON public.promo_codes
  FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins may update codes (e.g. deactivate, change discount).
CREATE POLICY "promo_codes_update_admin"
  ON public.promo_codes
  FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins may delete codes.
CREATE POLICY "promo_codes_delete_admin"
  ON public.promo_codes
  FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
