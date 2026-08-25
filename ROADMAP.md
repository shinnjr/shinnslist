# Shinnslist Growth Program — AI-Search + Onboarding

Updated: 2026-08-14 · Status: ACTIVE

## Objective
Make shinnslist.com the answer the AI engines cite whenever someone asks about finding a grant.
Target: the site surfaces for the large majority of grant-finding queries across ChatGPT, Perplexity,
Gemini, and Google AI Overviews — then converts that traffic with a near-zero-effort onboarding.

## Scoreboard
- Money earned (24h): $0 — closest to dollar is the first paying subscriber.
- Blocked: exhaustive-research LLM (needs spend sign-off — see Workstream B, decision D1).

## Workstream A — AI-search capture (in progress)
1. **AEO foundation** ✅ — `public/llms.txt`, `public/robots.txt` (explicit AI-crawler allows),
   `public/sitemap.xml`, Organization + WebSite JSON-LD in `layout.tsx`.
2. **Constant operation** ✅ — cron `shinnslist-ai-seo` (daily 7am): researches a grant-query
   cluster, writes a quotable page (stats + tables + FAQ + HowTo), updates sitemap/llms.txt,
   deploys, verifies 200. Cron `shinnslist-grant-coverage` (daily 6am) keeps the grant DB fresh.
3. **Content moat** — build query-cluster pages under `src/app/`:
   grants-for-women-founders, minority-owned, colorado-nonprofits, grants-vs-loans,
   how-to-write-a-winning-grant-application, early-stage-founders, no-fee-grants, federal-vs-state-vs-private.
   Each page: accurate stats (cited), comparison table, FAQPage JSON-LD, HowTo where relevant. No fabricated data.
4. **Index + citation monitoring** — add Search Console / Bing Webmaster verification; weekly
   spot-check that AI engines cite Shinnslist.

## Workstream B — Onboarding "magic prefill" (planned, next)
Goal: kill the 4-step manual form. New flow = minimal input → research → prefill → user corrects.
Mix of three inputs (James: "a mix of 3 first, then follow up tweaking"):
1. **Name/website → research → prefill** (PLOY.ai-style). Enter org name + optional website;
   backend researches the group and prefills applicant type, legal name, location, years operating,
   revenue range, ownership identities, mission, funding use.
2. **Doc upload** — upload 990 / business plan / pitch deck / prior apps; extract facts → prefill.
3. **Guided correction** — keep the existing structured form as the "correct us" review layer.

### Architecture
- New Pages Function `functions/api/research-profile.ts` (server-side; no client keys).
- v1 deterministic enrichment (no LLM, no spend): fetch org website → parse About/contact/location/
  social; IRS/Nonprofit-Explorer lookup for nonprofits; CO Secretary-of-State for businesses;
  regex/heuristics for entity type, identities, revenue range, year founded.
- v2 LLM synthesis via Cloudflare Workers AI (free tier) to draft mission/funding-use from scraped text.

### Decision D1 (BLOCKING spend sign-off)
"Exhaustive research" with a real search+reasoning model (Perplexity Sonar / OpenAI / Anthropic)
is the quality ceiling but adds a recurring API bill. Recommendation: ship v1 deterministic now
(free), add the search-LLM only if conversion stalls. James to approve any new API spend.

## Workstream C — Distribution (gated)
Outbound in grant communities (r/grants, r/nonprofit, LinkedIn, founder Facebook groups) under the
Shinnslist brand. Gated on James's go (public footprint).

## Workstream D — Trust/QA
Keep the two-approval gate + E2E suite green (Playwright 19-local/18-prod baseline).

## Current state / next actions
- AEO foundation files written; production build running; deploy + verify next.
- Next: onboarding prefill Function + UI (Workstream B v1), then content-moat pages (A3).
