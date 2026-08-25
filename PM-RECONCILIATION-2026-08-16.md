# PM Reconciliation — 2026-08-16 (program-manager cron)

> THIRD RUN (18:43 MDT): confirms the staged reconcile in `docs/reconcile-2026-08-16.md`
> is still accurate — no new surfaces since the 15:36 audit (only
> `docs/long-tail-coverage.md` + `scripts/.fbm_seen_state.json` touched, both covered by
> existing rows). `.hermes/PROGRAM.md` write still BLOCKED by the protected-file gate
> (no approval path on cron) — the replacement content remains staged in
> `docs/reconcile-2026-08-16.md` (updated this run with cron-health notes).
> **Next interactive session or James: replace the body of `.hermes/PROGRAM.md` after the
> header comment with the content in `docs/reconcile-2026-08-16.md`.**

RECORD ONLY — created because `.hermes/PROGRAM.md` and `.hermes/` are write-protected for
cron sessions (platform guard, no approval path). Fold this into `.hermes/PROGRAM.md`
(ownership table + merge log) on the next run with write access, then delete this file.

## What changed (real edits this run)
- `public/llms.txt` — FIXED stale AI-crawler content: removed 4 bullets claiming
  `/free-money` covers unclaimed property, bank signup bonuses, free stock, credit-builder
  tools (those verticals were deleted; `public/_redirects` 301s them to `/find`).
  Corrected the top description + Free Money Finder bullet to match real scope
  (class actions + grants/benefits). FAQ lines about unclaimed money/bonuses kept —
  general advice, not service claims.
- `public/sitemap.xml` — VERIFIED CORRECT, no edit. `/free-money`,
  `/free-money/class-actions`, `/find`, `/cart`, `/file/*` all present (280 URLs).
  Removed verticals correctly absent — do NOT restore (301 URLs in sitemap = SEO anti-pattern).

## Findings to fold into PROGRAM.md
1. STALE rows: unclaimed/bank-bonuses/free-stock/credit (files deleted);
   "Free-money hub + calculator" row references deleted `FreeMoneyCalculator.tsx`.
2. MISSING rows: Find hub (`src/app/find/page.tsx` + `UnifiedFind.tsx`), DFY engine
   (cart, file wizard, DfyButton, cart-checkout/dfy-wizard/dfy-confirm functions),
   lead capture (`functions/api/leads` + `FreeMoneyLeadCapture`), freebie deals feed
   (fbm_scraper canonical + freecycle + craigslist + top-deals), funders index.
3. ORPHANS (flag, no deletions): `/funders` page + `src/data/off-market-funders.json`
   — zero links (nav/sitemap/llms.txt). Unlinked pages `/top-deals`, `/watch`, `/vision`,
   `/builder`, `/post`. Orphaned components (zero importers): `DealFeedClient.tsx`,
   `TrendingSection.tsx`, `StatsBar.tsx`, `SearchBar.tsx`, `VerticalFilter.tsx`.
4. OVERLAP: 5 legacy FB-Marketplace feed engines (`fbm_playwright_feed.py`,
   `fbm_cdp_feed.py`, `fbm_alert_engine.py`, `fbm_pipeline.py`, `fbm_to_supabase.py`)
   vs canonical `fbm_scraper.py` (called by freebie-alert cron via
   `~/.hermes/scripts/freebie_ingest.py --engine ddg`). Extend fbm_scraper.py only.
5. PRIOR RUN FOLDED IN: 00:14 audit (`.hermes/AUDIT-2026-08-16.md`) was a degraded-tool
   no-op; its `.audit-probe.md` (33B) confirmed harmless — left in place.
6. IN-FLIGHT (don't duplicate): overnight-build (OVERNIGHT-BUILD.md), 3WS roadmap
   (ROADMAP-3WS.md), longtail sweep, AI-SEO cluster pages.

## Suggested merge-log entry for PROGRAM.md
- 2026-08-16 — PM audit: SEO verified (sitemap correct; llms.txt stale bullets removed);
  removed verticals marked do-not-restore; orphans flagged (funders page, 5 components,
  5 unlinked pages); fbm engine overlap flagged (fbm_scraper.py canonical); registry rows
  added for find/DFY/leads/deals/funders; degraded 00:14 audit folded in. No files deleted.
