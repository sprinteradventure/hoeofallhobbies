-- 014: Message email-notification throttle flags
-- Adds per-party "already notified" timestamps to public.conversations so the
-- /api/messages routes can send at most ONE new-message email per recipient
-- per thread until that recipient has read (or replied to) the thread:
--
--   * POST (send): the sender's own flag is cleared (they've clearly seen the
--     thread), then the route atomically claims the recipient's flag
--     (UPDATE ... SET <flag> = now() WHERE <flag> IS NULL). Only the request
--     that wins the claim sends the email, so rapid-fire messages and
--     concurrent sends can never double-notify.
--   * GET (read thread): the viewer's flag is cleared alongside mark-as-read,
--     re-arming notifications for the next message they receive.
--
-- Idempotent: safe to re-run. Run AFTER 001-013 in the Supabase SQL editor.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS buyer_notified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS seller_notified_at TIMESTAMP WITH TIME ZONE;
