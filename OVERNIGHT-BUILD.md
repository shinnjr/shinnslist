# Shinnslist — Overnight Autonomous Mission (self-improve to launch-ready)

> Canonical state file for the 30-min build agent. READ THIS FIRST, do the next chunk,
> update `[ ]` -> `[x]`, and verify. Self-contained — no chat memory. Never ask James anything.

## Goal
Get Shinnslist matching to "wow" quality and coverage: a Colorado individual (and a
women-owned founder like Susan) sees a tight, genuinely-relevant grant list. Revenue
target $100K/60d. Distribution is gated on James — do NOT launch or send anything.

## DONE (verified, live — do not redo)
- [x] Foreign/institutional grants hard-filtered (0 foreign surfaced).
- [x] Scorer: exact-token needs matching, geography all_us honored, state-match +18,
      no-location downrank -8, hard entity/geography/individual-eligibility gates.
- [x] Personalized results capped at top 40.
- [x] OSINT clickless onboarding: email/username -> Gravatar/GitHub/GitLab -> prefill.
- [x] Data enrichment pass 1: 266 grants got location (states) or category fix.

## REMAINING (in order)
- [x] Enrichment pass 2 — extract location for more of the still-no-location rows.
      Base: `scripts/enrich-data.ts`. DONE 2026-08-16: rewrote detectState
      (state-name-first + multi-word-city-first + ambiguity guards + removed
      columbus/jackson/charleston/springfield/wilmington/dover + alaska-native /
      native-hawaiian demographic normalization + washington_dc/kansas_city tokens).
      Applied: +242 rows got states, +14 vehicle→transportation category fixes,
      0 mis-detections in review (5 known false-positive classes eliminated).
      Dry-run → inspect → --apply, per spec. Never 2-letter abbrevs.
- [x] Junk soft-hide — directory listings that are service LOCATIONS, not grants
      ("St Vincent de Paul [city]", "Catholic Charities [city]", "Salvation Army [city]",
      "United Way"). DONE 2026-08-16: 24 rows status='closed' (REVERSIBLE — NEVER DELETE):
      SVdP ×6, Catholic Charities ×7, Salvation Army ×3, United Way/211 ×8. 8 real
      programs (car-repair, Angel Tree, Ride United, etc.) kept rolling. Ingest now
      preserves closed status so re-ingests can't re-open them.
- [x] Coverage — high-value Colorado + national individual/family grants added via the
      longtail sweep (42/42 demographic×need buckets [x], all source types [x],
      Colorado-heavy: CO rows got states in enrichment pass 2).
- [x] Re-verify after each batch: `npx tsx scripts/verify-matching.ts` — ran after
      enrichment + soft-hide: top-12 for a CO individual is local-first + relevant,
      eligible 1242 / hidden 1261 (24 junk hidden), no regressions.

## BOUNDARIES (hard rules)
- NO money, NO purchases, NO browser logins, NO external submissions.
- NO DELETE — only reversible status='closed' soft-hides + additive enrichment.
- Re-deploy ONLY if code changed; DB enrichment needs no deploy.
- NEVER invent grant data — only real, sourced programs (source_url required).

## VERIFY (run from ~/projects/freebie)
- `npx tsx scripts/verify-matching.ts`   -> top-12 + eligible/ineligible counts
- `npx tsx scripts/audit-data.ts`        -> source_type/geography/category buckets
- `npx tsx scripts/enrich-data.ts`       -> dry-run (add --apply to write)
- `curl -s https://shinnslist.com/api/grants | python3 -m json.tool`  (expect 0 foreign)

## KEY FILES
- Scorer: functions/_lib/grants.ts
- Grants API: functions/api/grants/index.ts
- OSINT: functions/api/research-profile/index.ts
- Enrichment: scripts/enrich-data.ts  |  Audit: scripts/audit-data.ts
- Supabase creds: .env.local (service role key — never print)
