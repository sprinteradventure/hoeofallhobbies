-- 008_profile_trigger.sql
--
-- P0 FIX: user_profiles rows were never created at signup.
-- Root cause: with email confirmation enabled, supabase.auth.signUp() returns
-- NO session, so auth.uid() is NULL and the RLS policy
-- "Users can insert their own profile" (WITH CHECK auth.uid() = id,
-- see 002_rls_policies.sql) blocked the client-side insert on the signup page.
-- Downstream breakage: cart_items.user_id (and orders, reviews, payouts, etc.)
-- REFERENCES public.user_profiles, so Add to Cart / checkout failed for every
-- affected user.
--
-- Fix: standard Supabase pattern — a SECURITY DEFINER trigger on auth.users
-- creates the profile row server-side at signup (bypasses RLS), plus a
-- backfill for the accounts already created without a profile.

-- 1. Trigger function: create a user_profiles row for every new auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  -- Username is UNIQUE: if the chosen username is already taken, still create
  -- the profile (username NULL) rather than failing the entire signup.
  WHEN unique_violation THEN
    INSERT INTO public.user_profiles (id, email, username)
    VALUES (NEW.id, NEW.email, NULL)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2. Trigger on auth.users (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill profiles for existing auth users that have none.
-- These accounts were created before the signup page passed username metadata,
-- so raw_user_meta_data has no username; insert with username NULL.
INSERT INTO public.user_profiles (id, email, username)
SELECT u.id, u.email, NULL
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
