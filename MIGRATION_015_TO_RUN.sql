-- 015: Message email-notification opt-out
-- Adds public.user_profiles.message_email_notifications so users can turn off
-- the new-message emails introduced in 014. DEFAULT TRUE keeps every existing
-- account opted in; the send path treats a NULL/missing value as enabled, so
-- the messaging API keeps working even before this migration is applied.
--
-- Idempotent: safe to re-run. Run AFTER 001-014 in the Supabase SQL editor.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS message_email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
