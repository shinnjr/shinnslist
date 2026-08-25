# Aggregator Reconciliation — what "Shinnslist" actually is

Date: 2026-08-15 · Author: SOUL (deep-research reconciliation pass, pre-external-research)
Trigger: "aggregators, it seems like my ideal way of compiling free public information into a package people will use."

## One-line verdict

James is right: aggregation is his ideal form factor, and he has already built the spine —
but one repo (`~/projects/freebie`, shinnslist.com) is carrying **four competing identities**,
and the canonical docs contradict each other on which one is real. This doc names them,
kills the stale rows, and defines the surviving identity + the research angles that follow.

---

## The 5 identities stapled to one name

| # | Identity | What it is | Where it lives | Status |
|---|---|---|---|---|
| 1 | **Deal aggregator** | scrape marketplaces → deal-score → alert → $subscription (flippers) | `RESEARCH.md` (100% this), `src/lib/deal-scorer.ts`, `workers/`, `scripts/` | **De facto dead on live site** — homepage has 0 "deal" mentions |
| 2 | **Aggregator builder** | hub-and-spoke: user builds their own "watches" | `BRIEF-AGGREGATOR-BUILDER.md` (spec only) | Never shipped; spec lives on |
| 3 | **Grant autopilot** | discover→qualify→draft→submit applications, $29/mo + credits | `PRODUCT.md`, `ROADMAP.md`, live homepage | **Live homepage identity** (title: "Grants found, drafted…"), but "rejected as ASAP winner" in CURRENT-STATE |
| 4 | **Free-money hub** | unclaimed / bank bonuses / class actions / free stock / credit | `PROGRAM.md` (Aug 15), `/free-money*` pages | **Live + most recent build** — 4 sub-pages HTTP 200, class-actions = 513KB of live settlements |
| 5 | **List Factory** | sell compiled public-data lists ($9–49) as data products | `~/life/_system/money/list-factory/` (7 verticals) | Separate dir; never launched |

Outside the repo: **CBD liquidation** (simpletinctures) = declared "first dollar" play, but it's a
physical product (vetoed category) and a one-off bridge to cover the AI burn — not the durable engine.

---

## The contradiction (evidence, not opinion)

Four artifacts, four different answers to "what is Shinnslist":

1. **`PRODUCT.md`** — "Shinnslist is a grant autopilot… Existing marketplace-deal features are **legacy**."
2. **`IDEA-BANK.md`** — #1 ranked idea = "Shinnslist Monetization (Vertical Subscriptions)" @ **100/100, "🔨 building"** (the deal aggregator).
3. **`project-paths.yaml`** — "multi-vertical deal aggregator. **PRIMARY revenue engine.**"
4. **`PROGRAM.md`** (Aug 15) — the active build is the **free-money hub** (unclaimed / bank bonuses / class actions / free stock / credit), which `PRODUCT.md` never mentions.

Cross-checked against the LIVE site (2026-08-15):
- `shinnslist.com/` → **grant autopilot** hero/title, 138 "grant" mentions, **0 "deal"**.
- `shinnslist.com/free-money` → "Free Money Finder — unclaimed cash, bank bonuses, free stock" (200).
- `shinnslist.com/free-money/class-actions` → live settlements page (200, 513KB).
- `shinnslist.com/free-money/unclaimed`, `/bank-bonuses` → 200.

So the deal aggregator is already scrubbed from production; the grant autopilot owns the homepage;
the free-money hub is the newest live spoke. The docs just never caught up.

---

## What "aggregator" means to James

His own note (`~/life/_system/apple-notes-2026-08/notes/aggregators.md`) lists: freebie app for moms,
porn search, estate sales, rental/Airbnb listings, coupons, free things to do, peptides, AI models,
tutors, high-end fashion. The uniform pattern is **compile a fragmented category of free/public info
into one browsable, trusted package** — not "do the application for them" (grant autopilot = a service)
and not "let users build their own aggregators" (builder = a platform).

---

## Surviving identity (recommendation)

**Shinnslist = an aggregation engine for free public money-adjacent information.**

One spine — *scrape → normalize → score → package → distribute* — many spokes:

1. **Free-money hub** (flagship, most built, grey-register aligned) — unclaimed / bank bonuses /
   class actions / free stock / credit. Monetize via affiliate + email list + lead-gen, never by
   charging claimants a cut (legal/FTC red line, already established).
2. **Deal finder** (parked) — the marketplace deal-scoring spoke. Valid, but not the beachhead.
3. **List Factory** (parked) — sell compiled data products off the same spine.

**Park or split out:** grant autopilot is a *service* (drafting/submitting), not an aggregator. It
should be its own thing or explicitly parked, not fought over inside the aggregation repo.
The "builder" (user-built watches) is a later platform layer, not the beachhead.

---

## Kill list (stale / contradictory rows to resolve)

- [ ] `PRODUCT.md` — rewrite from "grant autopilot + deals are legacy" → the aggregation identity
      above, with free-money as flagship spoke. (Or split grant-autopilot into its own repo/doc.)
- [ ] `IDEA-BANK.md` #1 "Shinnslist Monetization (Vertical Subscriptions)" — mark it as the
      *paused* deal-finder spoke, not the #1 live direction.
- [ ] `project-paths.yaml` — update "multi-vertical deal aggregator / PRIMARY revenue engine" →
      "free-public-info aggregation engine; free-money hub = flagship spoke."
- [ ] `RESEARCH.md` — still 100% deal-scoring verticals. Keep as the deal-finder spoke's reference,
      but stop treating it as the product definition.
- [ ] `CURRENT-STATE.md` / `ACTIVE-PROJECTS.md` — resolve "Shinnslist rejected as ASAP winner, no
      offer launch" vs `ROADMAP.md`'s "AI-SEO grant moat ACTIVE" (2 crons still burning cycles).
      Either the grant crons keep running or they get paused — pick one.
- [ ] CBD liquidation "first dollar" vs SOUL "no physical products" — name it as a one-off bridge
      to cover AI burn, not a durable engine, so it doesn't pollute the identity.

---

## Research angles (target of the external pass, on James's go)

1. **Competitive map** — who owns the "find your money" / free-money SERP: NerdWallet, WalletHub,
   Bankrate, The Penny Hoarder, Doctor of Credit, MoneySavingExpert, settlement administrators.
   Their monetization, traffic, and community size (subreddit/member counts).
2. **Data-source inventory** — which free-money feeds are legally scrape-able and free: settlement
   data, bank-bonus lists, free-stock promos. (Already killed: MissingMoney/NAUPA = ToS-banned +
   finder-license-gated; class-action filing survived and is live.)
3. **Unit economics** — affiliate CPA rates (partly in `references/bank-bonus-affiliate-programs.md`),
   email-list value, lead-gen payouts, subscription ceiling. Revenue per 1,000 visitors.
4. **What NOT to build** — anything finder-license-gated (unclaimed commission), ToS-locked
   (MissingMoney), or custody-gated (agent toll = 12–18mo, already researched). Fold prior
   kill-verdicts in so we don't re-litigate them.

Deliverable path: `~/projects/freebie/RESEARCH-FREE-MONEY.md`.

---

## Authorization line (paste back to run the external pass)

> Go — research the free-money aggregation engine: competitors, data sources, unit economics, kill-list.
> Save to ~/projects/freebie/RESEARCH-FREE-MONEY.md.
