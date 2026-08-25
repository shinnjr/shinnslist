# Shinnslist — Aggregator Builder (v1)

Build the "personal aggregator builder" feature into this repo (Next.js 16 static export + Cloudflare Pages Functions + Supabase). The product line: **"Build your own aggregator. Watch any market. Score every find."** Every signed-in user gets a hub of their own custom aggregators ("watches") that compile matched, deal-scored listings from the existing scraper pipeline. Different for everyone — each user's dashboard shows THEIR watches and THEIR compiled feeds.

## Ground rules
1. Read `AGENTS.md` in the repo root FIRST. This is Next.js 16 — NOT the Next.js from training. Read `node_modules/next/dist/docs/` before writing any Next code. Heed deprecation notices.
2. This app deploys as a **static export** (`output: "export"`). Next.js API routes do NOT run. All new backend goes in **Cloudflare Pages Functions** under `functions/` using the exact pattern in `functions/api/checkout.ts` (PagesContext {request, env}, `json()` helper, `userIdFromRequest`, `serviceClient` from `functions/_lib/supabase.ts`, `rateLimit` from `functions/_lib/rate-limit.ts`).
3. Do NOT touch: Stripe billing (`functions/api/checkout.ts`, `functions/api/billing`, `functions/api/webhooks`, `src/lib/pricing.ts`, `src/lib/billing.ts`, `src/lib/stripe.ts`), the scrapers (`workers/`, `scripts/`), or `src/lib/deal-scorer.ts`.
4. Do NOT deploy, do NOT git commit, do NOT modify `wrangler.toml`, `next.config.ts`, or `.env.local`. Stop at `npm run build` passing.
5. TypeScript strict. Reuse existing components (`src/components/ListingCard.tsx`, `BottomNav.tsx`), `src/lib/supabase/client.ts` / `server.ts`, and the brand: pink/magenta primary, near-black background, neon green for deal scores (see `src/app/globals.css`).
6. Keep every API route behind auth (`userIdFromRequest`). Validate input. Use `rateLimit` on POST/PATCH/DELETE.
7. Work autonomously through the whole spec, then run `npm run build` and fix every error until it passes. Report what you built and the final build result.

## Data model — new migration `supabase/migrations/003_aggregators.sql`
```sql
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
```
Enable RLS on both tables: users own their aggregators; aggregator_items are visible to the aggregator's owner (subquery on aggregators.user_id). Note: `serviceClient` uses the service role, so RLS is a safety net, not the enforcement path.

## Matching engine — `functions/_lib/aggregators.ts`
Pure TS shared by the run + feed endpoints. Export:
- `matchListing(config: {keywords: string[], categories: string[], min_price: number, max_price: number | null, min_deal_score: number, sources: string[]}, listing): {matched: boolean, reason: string | null, score: number}`
  - `sources` filter: `listing.source` must be in config.sources (also accept `'facebook'` ↔ `'freecycle'`/`'trashnothing'` as-is).
  - Keyword match: case-insensitive substring against `title` (and `description` if present). Reason `'keyword'`.
  - Category match: `listing.category` in config.categories. Reason `'category'`.
  - Free match: `price == 0` → reason `'free'` (matches regardless of keywords).
  - Price bounds: skip if `price > max_price` or `price < min_price` (min_price > 0).
  - Deal score: `listing.estimated_value` exists and > 0 → compute `round((estimated_value - price) / estimated_value * 100)`; else 0. Skip if score < `min_deal_score`.
- `runAggregator(client, aggregatorId): Promise<{inserted: number, total: number}>` — fetch the aggregator row, query `listings` (limit 500, newest first, source IN config.sources), run `matchListing`, upsert matches into `aggregator_items` (on conflict (aggregator_id, listing_id) do nothing), update `aggregators.last_run_at = now()`, return counts. If `zone_id` set, additionally require the listing's lat/lng inside the zone polygon (zone polygon is `[{lat,lng},...]`, use point-in-polygon ray casting; skip listings with no coordinates).

## API routes (Cloudflare Pages Functions, `functions/api/aggregators/`)
1. `index.ts` — GET: list the user's aggregators + `item_counts` (fresh items since last seen = `seen=false` count per aggregator) and `last_run_at`. POST: create (validate: name required ≤60 chars, emoji ≤4 chars, keywords ≤50 strings each ≤60 chars, categories ⊆ known ids from `src/data/interestTaxonomy.ts` — copy the id list into the function as a const, sources ⊆ {craigslist, offerup, facebook, freecycle}, min_price ≥ 0, max_price > min_price or null, min_deal_score 0–100, zone_id optional and must belong to the user). Returns created row.
2. `[id].ts` — PATCH: update own aggregator (same validation); DELETE: delete own aggregator (cascade removes items). 404 if not owned.
3. `[id]/run.ts` — POST: call `runAggregator` for own aggregator. Returns `{inserted, total, last_run_at}`.
4. `[id]/items.ts` — GET: own aggregator's items joined with listing fields (title, description, photos, price, estimated_value, category, source, source_url, city, state, posted_at, flags), ordered deal_score DESC, then created_at DESC; query params `limit` (default 50, max 100), `offset`, `filter=all|new|saved` (new = seen=false, saved = saved=true). Return `{items, total, aggregator}`.
5. `[id]/items/[itemId].ts` — PATCH: body `{seen?: boolean, saved?: boolean}` → update that item if it belongs to the user's aggregator.

## UI (App Router, static)
1. `/dashboard` — the hub. Header "Your watches" + "Build a watch" button. Grid of aggregator cards: emoji, name, keywords/categories summary line, sources chips, item count badge (unseen count highlighted in neon green), last run time, buttons: Run now, Open, Edit (link to builder with `?id=`), Delete (confirm). Empty state: big friendly "Build your first watch" with a 3-step explanation and CTA. Loading skeleton. Use `src/lib/supabase/client.ts` + the API endpoints. Mobile-first.
2. `/builder` — wizard-ish form in one scrollable page: name, emoji picker (small preset row + free text), keywords (comma input → chips), categories (multi-select grid from `INTEREST_CATEGORIES` in `src/data/interestTaxonomy.ts` — emoji + label), sources (checkbox chips), min price, max price (optional), min deal score slider (0–100 with live label like "Only steals (90+)"), zone select (from user's zones via existing `/zones` data — fetch zones from Supabase `zones` table for the user; "Everywhere" default), active toggle. Save → POST/PATCH → redirect to `/dashboard`. If `?id=` present, load and edit.
3. `/watch/[id]` — feed page: back link, aggregator header (emoji, name, Run now button, config chips), results grid reusing `ListingCard` (adapt props if needed; if the card needs a listing-shaped object, map fields), filter tabs All / New / Saved (client-side toggle via API `filter` param), empty state "Run this watch to compile your finds", "Run now" CTA. Mark-as-seen on scroll/click (fire PATCH seen=true when an item is clicked), Save button on cards (PATCH saved=true) with a saved filter.
4. Homepage (`src/app/page.tsx`) — when signed in, show a hero band "Your watches" linking to `/dashboard` above the existing public feed; when signed out keep the existing hero but add one line: "Build your own aggregator — watch any market, score every find. → Start free". Do not remove the existing deal feed.
5. `src/components/BottomNav.tsx` — add a "Watches" item (icon + label) linking to `/dashboard` for signed-in users (follow the existing auth-conditional pattern in the component; if it has none, add a minimal `user` check via `src/lib/supabase/server.ts` on the pages that render it).

## Definition of done
- Migration file written.
- Functions compile and are wired (types match `PagesContext`).
- `npm run build` exits 0 with the static export in `out/`.
- No changes to billing/scrapers/deploy files.
- Final report: files added/changed, build output tail, anything you skipped and why.
