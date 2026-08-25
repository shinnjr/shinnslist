# STAGED PROGRAM.md REPLACEMENT — 2026-08-17 (PM cron, write-gated)

> Registry write to `.hermes/PROGRAM.md` is BLOCKED for cron sessions (protected-file gate,
> no approver). This file contains the EXACT verified replacement body (ownership table +
> merge log + risks) from the 2026-08-17 program-manager audit. Apply it by replacing
> everything after the header comment in `.hermes/PROGRAM.md`, then delete this file.
> Same pattern as `docs/reconcile-2026-08-16.md` + `docs/audit-2026-08-17.md` (both folded
> in below — their deltas were re-verified against the repo this run and are included).

## REPLACEMENT BODY (paste into .hermes/PROGRAM.md after the header comment block)

## Ownership table (surface → files → status → owner)

| Surface | Files | Status | Owner |
|---|---|---|---|
| Free-money hub | `src/app/free-money/page.tsx`, `src/components/FreeMoneyLeadCapture.tsx` | live | this session (2026-08-15) |
| ~~Unclaimed / Bank bonuses / Free stock / Build credit~~ | ~~`src/app/free-money/{unclaimed,bank-bonuses,free-stock,credit}/page.tsx`~~ — FILES DELETED; `public/_redirects` 301s all four → `/find` | removed 2026-08-16 — DO NOT RESTORE | PM (audit 2026-08-16/17) |
| Class actions | `src/app/free-money/class-actions/page.tsx`, `src/data/classActions.ts` (auto-gen, ~265 settlements), `scripts/scrape_class_actions.py` | live (merged) | this session + legal-partner window + 5am refresh cron |
| Find hub (unified search) | `src/app/find/page.tsx`, `src/components/UnifiedFind.tsx` | live | overnight-build window |
| DFY filing engine | `src/lib/dfy.ts`, `src/lib/cart.ts`, `src/app/cart/`, `src/app/file/[slug]/` + `ClaimWizard.tsx`, `functions/api/cart-checkout.ts`, `functions/api/dfy-wizard.ts`, `functions/api/dfy-confirm.ts`, `functions/api/grant-applications/*`, `functions/api/billing/portal.ts`, `functions/api/webhooks/stripe.ts`, `src/components/DfyButton.tsx` | live | this session (2026-08-15) |
| Lead capture + trust events | `functions/api/leads/index.ts`, `src/components/FreeMoneyLeadCapture.tsx`, `supabase/migrations/005_leads_and_trust.sql` | live | WS1+WS3 (2026-08-15) |
| FB Marketplace freebie pipeline | `scripts/fbm_scraper.py` (CANONICAL — extend only), `scripts/.fbm_seen_state.json`; siblings flagged non-canonical: `fbm_pipeline.py`, `fbm_alert_engine.py` (+ `workers/fbm_alert_engine.py`), `fbm_cdp_feed.py`, `fbm_playwright_feed.py`, `fbm_to_supabase.py` | live (30m cron via `~/.hermes/scripts/freebie_ingest.py`) | freebie-alert ingest |
| Freecycle + Craigslist feeds | `scripts/freecycle_scraper.py`, `scripts/craigslist_to_supabase.py` | live | overnight-build window |
| Longtail sweep (assistance programs) | `scripts/ingest_longtail.py`, `scripts/_cron_bucket_check.py`, `docs/research/longtail-*.txt` | live (120m cron) | shinnslist-longtail-sweep |
| Grant DB (2,503 programs) | Supabase `grant_opportunities`; `scripts/ingest_grantsgov.py`, `ingest_usda.py`, `ingest_uk_grants.py`, `ingest_benefits.py` | live | grant-coverage + ingest crons |
| Grant scoring / eligibility | `functions/api/grants`, `functions/api/grant-profile` | live | shinnslist-status window |
| Grant autopilot submit | `functions/api/grant/[slug]`, `functions/api/grant-applications/*`, `workers/grant-engine/`, `workers/grant-runner/` | live | grant-autopilot (WS) |
| Aggregators API | `functions/api/aggregators/*`, `src/lib/aggregators-api.ts`, `supabase/migrations/003_aggregators.sql` | live | **owner unrecorded — FLAG** |
| OSINT profile enrichment | onboarding prefill + `functions/api/research-profile` | live | shinnslist-status window |
| Funders index | `src/app/funders/page.tsx`, `src/data/off-market-funders.json` | live but **ZERO links** (nav/sitemap/llms.txt) — orphan, flag | funder-index (monthly cron `funder_refresh.sh`) |
| Cloudflare Workers | `workers/checkout`, `workers/listings`, `workers/auth-callback`, `workers/fbm/`, `workers/craigslist-scrape-and-insert.ts` | live | various windows — registry gap, flag |
| Core app pages | remaining `src/app/*` (grants, pricing, learn, onboarding, etc.) | live | core |
| Unlinked pages (flag, no action) | `/top-deals`, `/watch`, `/vision`, `/builder`, `/post` | live, not in nav | — |
| Orphaned components (flag, no action) | `DealFeedClient.tsx`, `TrendingSection.tsx`, `StatsBar.tsx`, `SearchBar.tsx`, `VerticalFilter.tsx` — zero importers | — | — |
| Orphaned endpoint (flag, no action) | `functions/api/checkout.ts` — superseded by cart-checkout + billing/portal + webhooks/stripe, no callers | legacy | — |

## In-flight (do not duplicate)
- Overnight build (`OVERNIGHT-BUILD.md`) — top-down task list, 30m cron.
- 3WS roadmap (`ROADMAP-3WS.md`), AI-SEO cluster rotation (7am cron), longtail sweep (120m cron).
- `workers/fbm/` + `scripts/fbm_*` experimental siblings — do not extend; extend `scripts/fbm_scraper.py`.

## Merge log
- 2026-08-17 — **PM reconciliation (fold of staged 08-16 delta, docs/audit-2026-08-17.md)**: registry
  updated after two read-only runs. SEO verified — NO regression, do NOT restore removed
  verticals (301 URLs in sitemap = anti-pattern; AI-SEO cron preserving the vertical correctly).
  Stale rows fixed (removed verticals + hub-calculator file). Rows added for find/DFY/leads/
  freebie pipeline/longtail/aggregators/funders/workers. Overlaps flagged (fbm_* siblings,
  checkout.ts orphan, ownerless aggregators API). No files deleted.
- 2026-08-16 — **PM audit (18:43)**: SEO verified (sitemap correct; llms.txt stale bullets
  removed); removed verticals marked do-not-restore; orphans flagged (funders page, 5
  components, 5 unlinked pages); fbm engine overlap flagged (fbm_scraper.py canonical);
  degraded 00:14 audit folded in. Registry write blocked by sandbox — staged in
  `docs/reconcile-2026-08-16.md`, applied 2026-08-17.
- 2026-08-15 — **DFY filing engine (James's direction)**: time-estimator + rolling-rate
  pricing (`src/lib/dfy.ts`), localStorage cart + membership (`src/lib/cart.ts`),
  add-to-cart buttons on class actions/grants/apply, `/cart` checkout (Stripe
  mode=payment + trial subscription), `/file/[slug]` 4-step claim wizard with
  progress tracking, `dfy_orders` + `dfy_wizard_progress` tables, DFY disclosure
  copy on the class-actions page (FAQ "never pay" corrected to "never REQUIRED to pay").
  Server-authoritative pricing in `functions/api/cart-checkout.ts`.
- 2026-08-15 — **lead capture + trust data (WS1+WS3)**: added `/api/leads` Pages Function
  (POST email → Supabase `leads`, rate-limited) + `FreeMoneyLeadCapture` component on the
  `/free-money` hub + migration `005_leads_and_trust.sql` (`leads` + `trust_events` tables —
  the `trust_events` table is the agent-toll-bridge reputation-graph seed, see
  `~/projects/agent-toll/research/RESEARCH.md`).
- 2026-08-15 — **class-actions**: two parallel builds (marketing page vs scraper-backed
  settlement list) merged into one data-driven page: 203 live settlements (deadline-sorted,
  self-refreshing via `scripts/scrape_class_actions.py` + 5am cron) + honesty/FAQ/how-to.

## Known duplication risks to watch
- AI-SEO cron regenerates `public/sitemap.xml` + `public/llms.txt` daily — it MUST preserve
  `/free-money`, `/free-money/class-actions`, `/find`, `/cart`, `/file/*` and MUST keep the
  four removed verticals (`/unclaimed`, `/bank-bonuses`, `/free-stock`, `/credit`) ABSENT
  (they 301 → `/find`).
- `scripts/fbm_*` siblings + `workers/fbm_alert_engine.py`: extend `scripts/fbm_scraper.py` only.
- `functions/api/checkout.ts` is superseded — new work must use `cart-checkout.ts`.
- `simpletinctures` is a separate repo (`~/projects/simpletinctures`) — not this one.
- Live cron health (as of 2026-08-17 04:00): class-action 5am cron false-abort PATCHED
  (parser bug, `~/.hermes/scripts/refresh-class-actions.sh`) — next validation 08-17 05:00;
  freebie-alert ingest (30m) FAILING 8 straight runs — POST https://jamesshinn.com/api/ingest
  403 (secret/endpoint mismatch, likely changed in `~/projects/freebie-alert-kill`).
