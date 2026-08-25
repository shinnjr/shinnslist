# DFY Engine — Evaluation & Optimization Framework

Owner: SOUL session (2026-08-15). The DFY funnel's operating manual: what to
measure, where the numbers live, which levers to pull, and the review rhythm.

## The funnel (what to measure, in order)

1. **Visitors** → /free-money/class-actions, /grants, /file/*, /cart
   (Cloudflare Pages analytics; wire a Supabase event counter when volume matters)
2. **Wizard starts** → `dfy_wizard_progress` rows (kind, slug, step)
3. **Cart adds** → client-side (add a `trust_events` row: `dfy_cart_add` when cheap)
4. **Checkout sessions** → Stripe sessions with `metadata.dfy=1`
5. **Paid orders** → `dfy_orders` (status=paid) — THE money number
6. **Fulfilled** → `dfy_orders` status=filed/done (agent desk updates)
7. **Repeat / membership** → Stripe subscriptions on `dfy-member-monthly`

The one ratio that matters first: **paid orders ÷ wizard starts**. If wizard
starts are high and orders are zero, the price or the trust copy is wrong.
If visitors are high and wizard starts are zero, the hook or the CTA is wrong.

## The five levers (ranked by expected impact)

1. **Sliding-scale tiers** (`src/lib/dfy.ts` — classActionRateCentsPerMin /
   grantRateCentsPerMin). One-line changes; the biggest revenue dial.
   Defaults now: CA $1.00/$1.50/$2.50 per min by payout size; grants
   $1.50/$2.25/$3.00/$4.00 per min by award size.
2. **First bundle price** (`DFY.firstBundleCents`, $29). Raise only when
   conversion proves demand; it's the loss leader that starts memberships.
3. **Membership** (`DFY.memberMonthlyCents` $19, `memberPayPct` 25). The
   compounding asset; churn is the metric to watch here.
4. **Trust copy** (disclosure lines + the FAQ fix on the class-actions page).
   The FTC already burned DoNotPay for overpromising — our copy must stay
   boring-honest: "filing yourself is always free; we charge only for the work."
5. **Coverage** (settlement count + deadline freshness). More open claims =
   more surface; the 5am cron keeps it fresh.

## The weekly review (10 minutes, every Monday)

1. Pull `dfy_orders` count + revenue for the week (SQL below).
2. Pull wizard starts (step ≥ 2) and cart-to-order ratio.
3. If orders = 0 with traffic: cut the bundle to $19, raise trust copy, A/B the
   DfyButton label ("We file it · $14" vs "Done-for-you · $14").
4. If orders exist: raise the top tier rates 25% and watch for 2 weeks.
5. Log the decision in the merge log — no silent price changes.

```sql
-- weekly scoreboard
select count(*) as orders, sum(charged_cents)/100.0 as revenue
from dfy_orders
where status in ('paid','filed','done') and created_at > now() - interval '7 days';

-- funnel leak: wizards that never became orders
select count(distinct email) from dfy_wizard_progress where done = false;
```

## Honesty invariants (never break)

- Every page that sells DFY states: filing yourself is free, we are not a law
  firm, we take no cut of the recovery, fee = disclosed convenience.
- Never ping a decliner (done=true rows are excluded from the ping cron).
- Never file a claim for someone who answered "not eligible" in the wizard.
- Prices shown = prices charged (server clamps, client displays).

## Known next instruments (when traffic justifies)

- `trust_events` counters for cart adds / wizard starts (cheap, no new tables).
- Stripe's `dfy-member-monthly` subscription count as the membership KPI.
- r.jina.ai proxy may rate-limit the TCA bulk import — the scraper fails safe
  (keeps last good classActions.ts if any source fails).


## Eval log — 2026-08-16 (human-UX walk)
Walked the full funnel as a real user (headless Chromium, real clicks):
add-to-cart → /cart → Stripe Checkout (bundle renders $29) → wizard 4 steps
→ self-file (done=true → correctly NOT pinged).

Found & fixed:
- **Turnstile was silently broken site-wide** — CSP `script-src 'self'` blocked
  challenges.cloudflare.com, so the onboarding security check never loaded.
  Added script-src + frame-src allowlist. (Pre-existing bug, now live.)
- **Wizard review leaked placeholder junk** ("Phone: (your phone)") for empty
  optional fields — now omitted.
- Note: checkout completes on Stripe's hosted page (Sandbox until live flip);
  confirm chain verified to the payment gate (402 on unpaid, order-insert
  path code-reviewed). Test-card completion blocked by hCaptcha in headless
  — fine on a human browser; first real customer closes the loop.
