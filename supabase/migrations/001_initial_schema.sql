-- ============================================
-- Freebie App — Supabase Migration v1
-- ============================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- === Users ===
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  taste_profile JSONB DEFAULT '{}'::jsonb,
  max_distance INT DEFAULT 25,
  subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'pro', 'flipper')),
  onboarding_complete BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === Listings (cleaned, AI-processed) ===
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('nextdoor', 'offerup', 'facebook', 'craigslist', 'trashnothing')),
  source_url TEXT,
  source_id TEXT,                     -- original ID from source (for dedup)
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  price DECIMAL DEFAULT 0,
  estimated_value DECIMAL,
  category TEXT,                      -- AI-classified category ID
  brand TEXT,
  model TEXT,
  condition TEXT DEFAULT 'unknown' CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor', 'unknown')),
  flags TEXT[] DEFAULT '{}',          -- scam | damaged | free | undervalued | high-value | expiring-soon
  location GEOGRAPHY(POINT) NOT NULL,  -- PostGIS geography point
  city TEXT,
  state TEXT,
  zip TEXT,
  posted_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  ai_processed BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Geospatial index for proximity queries
CREATE INDEX idx_listings_location ON listings USING GIST (location);

-- Index for dedup (same item from same source)
CREATE UNIQUE INDEX idx_listings_dedup ON listings (source, source_id);
CREATE INDEX idx_listings_posted_at ON listings (posted_at DESC);
CREATE INDEX idx_listings_category ON listings (category);
CREATE INDEX idx_listings_flags ON listings USING GIN (flags);
CREATE INDEX idx_listings_free ON listings (price) WHERE price = 0;

-- === User swipes (learning taste) ===
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('right', 'left', 'up')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_swipes_user ON swipes (user_id, created_at DESC);
CREATE INDEX idx_swipes_listing ON swipes (listing_id);

-- === Custom zones ===
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  polygon JSONB NOT NULL,            -- [{lat: N, lng: N}, ...]
  enabled BOOL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zones_user ON zones (user_id);

-- === Route alerts ===
CREATE TABLE route_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  origin JSONB NOT NULL,             -- {lat, lng}
  destination JSONB NOT NULL,        -- {lat, lng}
  max_detour_minutes INT DEFAULT 15,
  enabled BOOL DEFAULT true,
  schedule JSONB,                    -- {days: [0,1,2...], timeWindow: {start, end}}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routes_user ON route_alerts (user_id);

-- === User listing actions (saved, dismissed, claimed) ===
CREATE TABLE user_listing_actions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('saved', 'dismissed', 'claimed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, listing_id, action)
);

CREATE INDEX idx_actions_user ON user_listing_actions (user_id, created_at DESC);

-- === Scraped listings (raw, pre-AI) ===
CREATE TABLE listings_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,
  raw_data JSONB NOT NULL,           -- full scraped payload
  processed BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_raw_dedup ON listings_raw (source, source_id);

-- === ROW LEVEL SECURITY ===

-- Users: can read/update own row only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users
  FOR ALL USING (auth.uid() = id);

-- Listings: public read, nobody writes directly (scraper writes via service key)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY listings_public_read ON listings FOR SELECT USING (true);

-- Swipes: user owns their swipes
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY swipes_self ON swipes
  FOR ALL USING (auth.uid() = user_id);

-- Zones: user owns their zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY zones_self ON zones
  FOR ALL USING (auth.uid() = user_id);

-- Route alerts: user owns their routes
ALTER TABLE route_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY routes_self ON route_alerts
  FOR ALL USING (auth.uid() = user_id);

-- User listing actions: user owns their actions
ALTER TABLE user_listing_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY actions_self ON user_listing_actions
  FOR ALL USING (auth.uid() = user_id);

-- Raw listings: service-only (no direct user access)
ALTER TABLE listings_raw ENABLE ROW LEVEL SECURITY;

-- === HELPER: nearby listings query ===
-- Usage: SELECT * FROM nearby_listings(-105.0, 40.0, 25, 50);
CREATE OR REPLACE FUNCTION nearby_listings(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  radius_miles INT DEFAULT 25,
  result_limit INT DEFAULT 50
)
RETURNS SETOF listings
LANGUAGE sql
STABLE
AS $$
  SELECT l.*
  FROM listings l
  WHERE ST_DWithin(
    l.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_miles * 1609.34  -- miles to meters
  )
  ORDER BY l.posted_at DESC
  LIMIT result_limit;
$$;

-- === HELPER: count free listings near a point ===
CREATE OR REPLACE FUNCTION free_nearby_count(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  radius_miles INT DEFAULT 25
)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM listings l
  WHERE l.price = 0
    AND ST_DWithin(
      l.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.34
    );
$$;
