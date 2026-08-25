-- ============================================
-- Aggregator Builder (v1) — personal watches
-- ============================================

CREATE TABLE aggregators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🛍️',
  keywords TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{craigslist,offerup,facebook}',
  min_price NUMERIC DEFAULT 0,
  max_price NUMERIC,
  min_deal_score INT DEFAULT 0,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  active BOOL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_aggregators_user ON aggregators (user_id);

CREATE TABLE aggregator_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregator_id UUID NOT NULL REFERENCES aggregators(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  deal_score INT DEFAULT 0,
  matched_reason TEXT,
  seen BOOL DEFAULT false,
  saved BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (aggregator_id, listing_id)
);

CREATE INDEX idx_agg_items_agg ON aggregator_items (aggregator_id, deal_score DESC);

-- === ROW LEVEL SECURITY ===
-- Safety net only — Pages Functions use the service role.

ALTER TABLE aggregators ENABLE ROW LEVEL SECURITY;

CREATE POLICY aggregators_owner ON aggregators
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE aggregator_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY aggregator_items_owner ON aggregator_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM aggregators a
      WHERE a.id = aggregator_items.aggregator_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aggregators a
      WHERE a.id = aggregator_items.aggregator_id
        AND a.user_id = auth.uid()
    )
  );
