-- 007: Moderation layer
-- Adds a public.reports table for listing/user reports, tightens the reviews
-- INSERT policy so only verified purchasers can review, and sets up RLS so
-- users can only file and read their own reports. Admin access happens
-- through the service-role client (bypasses RLS), so no admin policies are
-- needed here. Run AFTER 001-006 in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Reports table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT reports_target_required
    CHECK (product_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_product_id ON public.reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);

-- ---------------------------------------------------------------------------
-- RLS for reports: users can file reports as themselves and read only their
-- own. No user-facing UPDATE/DELETE — moderation actions go through admin API
-- routes using the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

GRANT SELECT, INSERT ON public.reports TO authenticated;

-- ---------------------------------------------------------------------------
-- Reviews safeguard: a signed-in user may only insert a review tied to an
-- order they actually placed AND paid for (statuses at or past 'paid'), with
-- at least one purchased line item. Replaces the loose policy from 002 that
-- only checked auth.uid() = reviewer_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Buyers can create reviews" ON public.reviews;
CREATE POLICY "Buyers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.id = order_id
        AND o.buyer_id = auth.uid()
        AND o.status IN ('paid', 'shipped', 'delivered', 'completed')
    )
  );
