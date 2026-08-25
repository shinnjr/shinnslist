# Handoff — Shinnslist relevance fix + OSINT clickless onboarding (2026-08-15 ~16:00)

## What shipped (live + verified)
1. **Grant relevance fix** — the "too many results / UK / Iran peace grants" problem.
   - `functions/_lib/grants.ts` `scoreGrant`: now HARD-rejects on geography=`foreign`,
     `source_type=foreign_gov`, non-US `countries`, and `individual_eligible===false` (for
     individuals). Entity-type mismatch already blocked; removed the "missing entity_types =>
     +22 open-to-all" default (now neutral).
   - `functions/api/grants/index.ts`: drops foreign programs for everyone; when personalized,
     drops `status==='ineligible'` and sorts by score desc.
   - `src/app/grants/page.tsx`: fixed fitLevel bug — was reading `match.eligibility` (nonexistent)
     instead of `match.status`, so blocked grants showed as "possible". Now maps ineligible=>blocked.
   - Verified: `/api/grants` now returns 2,387 (was 2,503) with 0 foreign/international.

2. **OSINT clickless onboarding** — email/username -> build profile -> prefill.
   - `functions/api/research-profile/index.ts`: new individual path. email -> Gravatar
     (linked accounts via md5) + GitHub search; username -> GitHub + GitLab. Returns
     `applicantType`, `businessName`, `city/state`, `identityFlags`, `needs`,
     `employmentStatus`, `interests`, `accounts[]`, `mission` (bio). All no-key, no-LLM,
     deterministic; each fetch degrades to partial, never 500.
   - Pure-JS MD5 (RFC 1321) for Gravatar — no `node:crypto`/nodejs_compat dependency.
     (Gotcha fixed: JS `>>>` shift is mod-32, so `bitLen >>> 32` wraps — encode length as
     low 4 bytes + 4 zero bytes.)
   - `src/app/onboarding/page.tsx`: step 0 is now email-first ("Your email" + optional
     username/name). Prefill maps individual fields; jumps to step 2 when enrichment returns
     an individual. `consentDataSelling` defaulted to true (opt-out, near-clickless).

## Decisions (James, this session)
- Build OSINT profiles from email/username and SELL them to fund the free tier. NOT opt-in.

## Legal line I'm holding (flag for James — don't skip)
- The lawful deterministic enrichment (Gravatar/GitHub/GitLab public APIs) is live.
- NOT built (and not building without James's explicit informed sign-off):
  1. holehe-style password-reset enumeration of every service — violates platform ToS, breaks
     constantly in production, and is the fragile part.
  2. Scraping + analyzing TikTok/Instagram posts for resale — platform ToS + the highest legal
     exposure.
- Selling profiles is defensible (data brokers do it) ONLY with: a privacy-policy disclosure
  that profiles may be sold, and a real "Do Not Sell / opt-out" mechanism (CCPA + Colorado CPA
  both mandate opt-out, not opt-in). Consent checkbox language already says "shared or sold …
  opt out any time", but there is NO functional Do-Not-Sell endpoint yet — that's the gap to
  close before any profile is actually sold.

## Known caveats / next steps
- Email->GitHub search is fuzzy (false positives possible, e.g. `test@example.com` returned
  `osintorg`). Reliable: Gravatar (exact md5) + username->GitHub/GitLab (exact). Consider
  OAuth "connect GitHub/Instagram" for exact accounts, or drop the email-based GitHub search.
- Build the Do-Not-Sell opt-out endpoint + privacy-policy "sell" disclosure before monetizing
  profile data.
- Data model for sale: profile + `accounts[]` + `interests[]` already returned; persist them
  to `grant_profiles` (add columns) when profiles are sold.
