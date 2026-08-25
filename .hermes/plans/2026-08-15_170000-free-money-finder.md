# Free Money Finder — Shinnslist Vertical

**Status:** DRAFT plan · Created 2026-08-15 · Author: Hermes (business partner)
**Objective:** Expand Shinnslist from "grants for orgs" to "every dollar you're owed but haven't claimed" — a free-money vertical that funds the free tier and feeds the grant funnel.

## 1. Executive outcome

Add a **Free Money Finder** to Shinnslist: three verticals + a calculator.

- **Unclaimed property** (~$80B held by state treasurers) — free to claim. We link people to the official search portals (missingmoney.com / state treasurer sites). This is the top-of-funnel trust hook.
- **Bank account bonuses** — banks/fintechs pay $50–300 per funded account via affiliate networks. This is the core referral revenue.
- **Class-action settlements** — billions unclaimed, filing is free. Aggregator model monetizes via ads + affiliate + email list.

**The calculator** ("how much free money do I have?") ties them together: name → unclaimed property amounts; situation → bank-bonus amounts; eligibility → class-action claim ranges. Every number is real and claimable — no fabrication. Monthly re-check = retention loop.

## 2. Honest monetization (the consigliere correction)

- **Unclaimed money: NO finder's fee.** Charging a commission to "find" unclaimed property is regulated in most states (heir-finder laws, fee caps, written contracts) and reads as scammy. We do the free version — link to official state portals — and monetize the *adjacent* offers (bank bonuses, class actions, financial products) around it. This is also exactly James's "we're not lying about any of it" bar.
- **Bank bonuses: affiliate fees — FINtech only, not big banks.** Confirmed Chase/Wells/Citi/BofA/CapOne have no public checking affiliate program (lead-gen / invitation-only). The revenue lane is fintechs via Impact / MaxBounty / CJ: Chime, SoFi, Webull, Moomoo, Current, Varo, Upgrade, Axos pay ~$20–140 per funded account (exact rates are login-walled — read the Impact rate card after approval). Requires traffic to get approved; FTC affiliate disclosure required.
- **Class actions: the real money is attorney lead-gen (B2B), not per-claim.** Top Class Actions monetizes by selling plaintiff leads to law firms (2M visits/mo, 700K email subs, 100+ firms, 25K plaintiffs/yr) plus email list + display ads. Consumer filing stays free; settlement outbound links are NOT monetized per-claim. Our class-action play = lead-gen to firms (later lever, needs volume) + a "new settlements" email list — not a per-claim fee.

## 3. Success definition

1. Calculator live + three vertical pages + a maintained state/offer database.
2. First affiliate program approved + first referral fee tracked.
3. Free-money traffic measurably feeding the grant signup funnel.
4. Revenue: affiliate fees ≥ free-tier hosting/infra cost (first threshold), then contributing to subscription.

## 4. Stages

### Stage 1 — Validate + build the data model (this week)
- Unclaimed property: authoritative portals, state-by-state claim process, finder-fee legal rules, any lawful data sources/APIs.
- Bank bonuses: current affiliate networks, which fintechs/banks pay, payout terms, approval requirements.
- Class actions: aggregator monetization model, open-settlement data sources, admin referral programs.
- Deliverable: data schema + content rules + "honest claims" policy. **Acceptance: each vertical's source + payout terms documented with live URLs.**

### Stage 2 — Calculator + free-money pages (SEO/AEO moat)
- Calculator: name-search (unclaimed), eligibility quiz (bank bonuses), claim-range lookup (class actions).
- Content pages: unclaimed-money-by-state, bank-bonus-rankings, open-class-action-settlements. GEO-optimized, cited, no fabricated amounts.
- **Acceptance: calculator returns real amounts for test queries; pages deploy + 200.**

### Stage 3 — Monetize
- Join affiliate networks + direct fintech programs; wire referral links into bank-bonus pages + calculator results.
- Conversion tracking (which link → funded account → fee).
- **Acceptance: live referral links + at least one tracked conversion.**

### Stage 4 — Integrate + fund the free tier
- Free-money traffic → grant funnel (upstream) + affiliate revenue (downstream).
- Analytics + attribution; refresh job for bank-bonus terms (they change monthly) + open settlements.
- **Acceptance: affiliate revenue covering free-tier cost; grant signups attributable to free-money entry.**

## 5. Risks / honest challenges

- Referral fees need traffic → build free tools first, affiliate second.
- Unclaimed "finder fee" is regulated → free version only.
- Don't dilute the grant autopilot: grants = subscription revenue; free-money = top-of-funnel + affiliate.
- Compliance: bank-bonus terms change monthly (needs a cron refresh); calculator must never show a number it can't source.
- No credit-card churning advice (5/24 risk) beyond bank account bonuses — or clearly flag it.

## 6. Non-goals (v1)

- No finder's-fee charging for unclaimed money.
- No fabricated "you're owed $X" — calculator only reports amounts it can source live.
- No credit-card SUB / churning content (bank *account* bonuses only, at least initially).

## 7. Open decisions

- Priority vs. grant-autopilot monetization (onboarding prefill → first subscriber): recommend parallel — free-money vertical is the top-of-funnel engine, grant prefill is the conversion engine; both feed the same funnel.
- Branding/naming of the vertical (interim: "Free Money Finder").
