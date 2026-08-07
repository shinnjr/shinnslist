-- ============================================
-- Shinnslist — Billing migration v2 (Stripe)
-- Adds Stripe billing state to the users table.
-- Run after 001_initial_schema.sql in the Supabase
-- SQL editor (idempotent — safe to re-run).
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'trialing', 'past_due', 'unpaid', 'canceled'));

-- Add-on entitlement flags (paid + bundled).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS addon_instant   BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_state     BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_research  BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_export    BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_digest    BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_country   BOOL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_roadtrip  BOOL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users (stripe_customer_id);
