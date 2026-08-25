# Shinnslist — Program Registry (single source of truth)

**READ THIS BEFORE BUILDING. UPDATE IT AFTER BUILDING.**

Multiple chat windows and 7 cron jobs all write to this repo. That is exactly how we
got two class-action builds. This file is the coordination point: check ownership here
before you write a single file, and record what you did after. The program-manager
cron (`shinnslist-program-manager`, every 3h) audits this file against the repo and
flags drift.

## Coordination protocol (non-negotiable)
1. **Before building:** grep the ownership table. If a surface already has an owner with
   status `live` or `wip`, do NOT rebuild it — extend or merge instead.
2. **After building:** add/update your row (surface, files, status, owner = session/agent id).
3. **Never** create a second implementation of an owned feature. Merge into the existing one.
4. The PM cron reconciles anything you forget to record.

## Ownership table (surface → files → status → owner)

| Surface | Files | Status | Owner |
|---|---|---|---|
| Free-money hub + calculator | `src/app/free-money/page.tsx`, `src/components/FreeMoneyCalculator.tsx` | live | this session (2026-08-15) |
| Unclaimed money | `src/app/free-money/unclaimed/page.tsx` | live | this session |
| Bank bonuses | `src/app/free-money/bank-bonuses/page.tsx` | live | this session |
| Class actions | `src/app/free-money/class-actions/page.tsx`, `src/data/classActions.ts`, `scripts/scrape_class_actions.py` | live (merged) | this session + legal-partner window |
| Free stock | `src/app/free-money/free-stock/page.tsx` | live | this session |
| Build credit | `src/app/free-money/credit/page.tsx` | live | this session |
| Free-money data | `src/data/free-money.ts` | live | this session |
| Grant DB (2,503 programs) | Supabase `grant_opportunities` | live | grant-coverage + ingest crons |
| Grant scoring / eligibility | `functions/api/grants`, `functions/api/grant-profile` | live | shinnslist-status window |
| OSINT profile enrichment | onboarding prefill + entity-enrichment | live | shinnslist-status window |
| Core app pages | `src/app/*` (grants, pricing, learn, onboarding, etc.) | live | core |

## In-flight (do not duplicate)
- (none right now)

## Merge log
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
  the `/free-money*`, `/cart`, and `/file/*` routes or the free-money vertical + DFY engine
  drops out of search.
- `simpletinctures` is a separate repo (`~/projects/simpletinctures`) — not this one.
