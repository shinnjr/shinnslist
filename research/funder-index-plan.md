# Funder Index — Build Plan (researched 2026-08-16)

**Goal:** compile every US grant-making entity (the "off-market" funder index), map it to the
28 underserved verticals, enrich with contacts, keep it fresh, and wrap it in the find+file
autopilot. Build once, moat high.

## Data rails (all free/public — verified live this session)

| Rail | What | Status |
|---|---|---|
| **IRS Business Master File (BMF)** | ~1.9M exempt orgs: EIN, name, address, NTEE code | free CSV, `irs.gov/pub/irs-soi/eo{1..4}.csv` |
| **IRS 990-PF bulk** | grants-paid (Schedule I), assets, officers, for every private foundation | free XML on AWS `registry.opendata.aws/irs990` |
| **Grantmakers.io** | pre-compiled open index of ~127k private foundations + millions of grants | free, open-source, covers **private foundations only** |
| **ProPublica Nonprofit Explorer API** | free 990 JSON (no auth, rate-limited) | verified working (6,478 CO "foundation" hits) |

## The moat = the coverage gap + inference layers

Grantmakers.io (the free incumbent) covers **only** ~127k private foundations. It explicitly
excludes community foundations (~800), corporate foundations (~2.5k), operating foundations,
and grantmaking public charities (United Ways, etc.) — pushing the true grant-maker universe to
~150k–170k tax-exempt entities, plus ~13k government programs.

The walls (none of these are the raw data, which is public):
1. **Full coverage** — private + community + corporate + operating + grantmaking public charities (the extra ~25–40k Grantmakers.io skips).
2. **Cause-inference** — classify each funder by what it *actually paid* (grants history), not its vague stated mission → maps to the 28 verticals. Proprietary IP.
3. **Contact enrichment** — website/email/phone + skip-trace the no-website long tail. Expensive to keep warm.
4. **Freshness** — continuous pipeline (new 990s drop monthly).
5. **Find+file autopilot bundle** — data + matching + drafting + filing = stickier than data alone.

## Phases

1. **Enumerate** (now) — pull BMF, isolate grant-makers by NTEE `T` codes + `FOUNDATION` column, produce first real count + list skeleton.
2. **Grants data** — pull 990-PF from AWS, extract Schedule I grants-paid per funder.
3. **Moat layers** — cause-inference, contact enrichment, 28-vertical matching, freshness cron.
4. **Product** — the find+file autopilot per vertical (homebuyers, farms, energy first).

## Execute now
Phase 1, step 1: download BMF, count NTEE grant-maker codes, emit the off-market list skeleton.
