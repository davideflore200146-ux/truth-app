/*
# Price Comparison App — Core Database Schema

## Overview
Creates the complete backend foundation for a price-comparison app with:
- User profiles (language, premium subscription, monthly search quota)
- Search history (text search, URL paste, image recognition)
- Favorites (saved searches for ongoing price monitoring)
- Affiliate merchants (configurable affiliate links for revenue tracking)

## New Tables

### 1. profiles
- `id` (uuid, PK, references auth.users) — one row per registered user
- `language` (text, default 'it') — UI language preference (it, en, es, pt, fr, de, sc)
- `is_premium` (boolean, default false) — whether the user has an active premium subscription
- `premium_expires_at` (timestamptz, nullable) — when the premium subscription expires
- `created_at` / `updated_at` (timestamptz) — audit timestamps

### 2. searches
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users) — owner
- `search_type` (text) — one of: 'text', 'url', 'image'
- `query` (text) — the product name/model, pasted URL, or image description
- `image_url` (text, nullable) — storage path for uploaded image (image searches only)
- `best_price` (numeric, nullable) — lowest price found
- `average_price` (numeric, nullable) — average market price
- `currency` (text, default 'EUR')
- `results` (jsonb, nullable) — full comparison results from merchants
- `created_at` (timestamptz)

### 3. favorites
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users) — owner
- `query` (text) — the saved search query
- `search_type` (text) — one of: 'text', 'url', 'image'
- `target_price` (numeric, nullable) — optional price-drop alert threshold
- `last_best_price` (numeric, nullable) — last known best price (updated on re-check)
- `last_checked_at` (timestamptz, nullable) — when the favorite was last refreshed
- `created_at` (timestamptz)

### 4. search_quotas
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users) — owner
- `month_year` (text) — e.g. '2026-09' for the calendar month
- `search_count` (integer, default 0) — number of searches performed this month
- `max_searches` (integer, default 10) — limit for free users (premium = unlimited)
- Unique constraint on (user_id, month_year) — one quota row per user per month

### 5. affiliate_merchants
- `id` (uuid, PK)
- `name` (text) — e.g. 'Amazon', 'eBay'
- `base_url` (text) — merchant base URL
- `affiliate_tag_param` (text) — URL parameter for the affiliate ID (e.g. 'tag')
- `affiliate_tag_value` (text) — the actual affiliate ID/tag value
- `affiliate_percentage` (numeric) — commission percentage (e.g. 8.00)
- `logo_url` (text, nullable) — merchant logo
- `is_active` (boolean, default true)
- `sort_order` (integer, default 0) — display ordering
- `created_at` (timestamptz)

## Security (RLS)
- All tables enable RLS.
- profiles, searches, favorites, search_quotas: owner-scoped CRUD (authenticated users can only access their own rows).
- affiliate_merchants: read-only for authenticated users (merchants are app-wide config, not user-editable).

## Notes
1. Owner columns default to `auth.uid()` so frontend inserts that omit `user_id` succeed.
2. A trigger auto-creates a profile row when a new auth.users row is inserted (on sign-up).
3. The `search_quotas` table uses a unique constraint on (user_id, month_year) to ensure exactly one quota counter per user per calendar month.
4. Premium users bypass the search quota check (handled in application logic, not in the DB).
*/

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'it',
  is_premium boolean NOT NULL DEFAULT false,
  premium_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Note: profiles are auto-created by trigger, no delete policy needed.
-- Users cannot delete their own profile row directly.

-- ============================================================
-- 2. SEARCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type text NOT NULL DEFAULT 'text',
  query text NOT NULL,
  image_url text,
  best_price numeric(10, 2),
  average_price numeric(10, 2),
  currency text NOT NULL DEFAULT 'EUR',
  results jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_searches" ON searches;
CREATE POLICY "select_own_searches" ON searches FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_searches" ON searches;
CREATE POLICY "insert_own_searches" ON searches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_searches" ON searches;
CREATE POLICY "update_own_searches" ON searches FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_searches" ON searches;
CREATE POLICY "delete_own_searches" ON searches FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for fast history queries
CREATE INDEX IF NOT EXISTS idx_searches_user_created ON searches(user_id, created_at DESC);

-- ============================================================
-- 3. FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  search_type text NOT NULL DEFAULT 'text',
  target_price numeric(10, 2),
  last_best_price numeric(10, 2),
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_favorites" ON favorites;
CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at DESC);

-- ============================================================
-- 4. SEARCH_QUOTAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS search_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  search_count integer NOT NULL DEFAULT 0,
  max_searches integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE search_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quotas" ON search_quotas;
CREATE POLICY "select_own_quotas" ON search_quotas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quotas" ON search_quotas;
CREATE POLICY "insert_own_quotas" ON search_quotas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quotas" ON search_quotas;
CREATE POLICY "update_own_quotas" ON search_quotas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quotas" ON search_quotas;
CREATE POLICY "delete_own_quotas" ON search_quotas FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 5. AFFILIATE_MERCHANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_url text NOT NULL,
  affiliate_tag_param text NOT NULL DEFAULT 'tag',
  affiliate_tag_value text NOT NULL DEFAULT '',
  affiliate_percentage numeric(5, 2) NOT NULL DEFAULT 0,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_merchants ENABLE ROW LEVEL SECURITY;

-- Merchants are app-wide config: all authenticated users can read.
-- Only service role can insert/update/delete (done via admin/edge functions).
DROP POLICY IF EXISTS "select_merchants" ON affiliate_merchants;
CREATE POLICY "select_merchants" ON affiliate_merchants FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 6. AUTO-CREATE PROFILE TRIGGER
-- ============================================================
-- When a user signs up, a profile row is automatically created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. SEED DEFAULT AFFILIATE MERCHANTS
-- ============================================================
INSERT INTO affiliate_merchants (name, base_url, affiliate_tag_param, affiliate_tag_value, affiliate_percentage, sort_order, is_active)
VALUES
  ('Amazon', 'https://www.amazon.it', 'tag', '', 8.00, 1, true),
  ('eBay', 'https://www.ebay.it', 'aff TRACK_PARAM', '', 5.00, 2, true),
  ('AliExpress', 'https://www.aliexpress.com', 'aff_fcid', '', 6.00, 3, true)
ON CONFLICT DO NOTHING;
