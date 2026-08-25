# Founding Funding Year — 7-Day Revenue Sprint

**Status:** shaped and ready for James's one direction-setting approval; no production or outreach action yet  
**Owner:** Hermes  
**Decision date:** 2026-08-13  
**Primary objective:** collect the first real Shinnslist customer payment within 7 days without creating another product, buying ads, or requiring sales calls from James.

## Recommendation

Sell a concierge-led version of the product already live: **Founding Funding Year** for small Denver-area public charities without a grant department.

- **Free evidence preview:** one organization truth profile, three source-backed matches, eligibility/effort explanation, and one application preview with missing facts visibly blocked.
- **Commercial offer:** **$499 for 12 months**, including ongoing verified matching/deadline tracking and five application-ready packages; additional completed-package credits are $39.
- **Low-risk conversion mechanism:** after the free preview, a **$99 deposit** secures the founding plan and is applied to the $499 total; the remaining $400 is due after the first application-ready package is reviewed.
- **Fulfillment posture:** concierge/manual behind the scenes where automation is incomplete. The customer sees a reliable outcome, not a promise that every funder portal is automated.
- **Promise:** verified eligibility to an application-ready package, with human approval and a receipt. No grant-award guarantee and no autonomous legal attestations or final submission.

## Why this is the best first-dollar bet

1. The product, brand, grant corpus, applicant-profile workflow, drafting engine, and approval boundary already exist; a new build is unnecessary.
2. Qualitative demand evidence says users will pay for completed applications rather than another grant directory.
3. The current IRS-derived pool contains 1,959 Denver-metro public charities in the target revenue band, including 1,049 with Denver city addresses.
4. Official competitor prices observed on 2026-08-11 span roughly $32–$349/month; $499/year with bounded application-ready credits is credible but still unvalidated.
5. The live $29/month offer cannot create meaningful near-term cash efficiently and has zero measured paid conversion.

## Facts, assumptions, and evidence test

### Verified facts
- Shinnslist is live at `https://shinnslist.com/` and returned HTTP 200 on 2026-08-13.
- The live product currently presents a free preview, `$29/month`, and low-cost submission credits.
- The market ledger records zero paid conversion, deposits, or representative human usability sessions.
- The IRS-derived Colorado pool has 1,959 target-band Denver-metro organizations.
- Reddit evidence supports the pain around completing applications and the need for quality/human approval; it does not validate price.

### Assumptions to test
- A small nonprofit will place a $99 deposit after seeing its own free evidence preview.
- Five bounded application-ready packages justify a $499 annual commitment.
- Personalized, proof-first email outreach can acquire customers without James taking calls.
- We can fulfill the first paid package within 72 hours using the existing grant workflow plus manual operator support.

### Pass/fail evidence
- **Pass by day 7:** at least one $499 annual purchase, or two $99 deposits from qualified primary-ICP buyers.
- **Supporting pass:** eight representative product tests, including five nonprofit decision makers and two grant consultants; at least 6/8 complete the core journey and at least 5/8 understand the approval boundary.
- **Kill/reposition threshold:** after 50 qualified, delivered, personalized outreaches and at least eight completed previews, zero deposits and fewer than five substantive positive replies. If reached, stop the annual offer before building more and test a paid one-application package instead.

## Scope map

| Company area | Status | Sprint scope |
|---|---|---|
| Customer/problem | In scope | Small public charities, $100K–$2M income, recurring grants, no grant department |
| Offer/revenue | In scope | Free proof preview → $99 deposit → $499 founding annual plan |
| Acquisition | In scope | Public-data prospecting, website/contact enrichment, personalized email, one follow-up |
| Product surfaces | In scope | Offer/pricing page, profile, match rationale, application preview, approval boundary, checkout |
| Fulfillment | In scope | Three verified matches and one application-ready package; manual fallback allowed |
| Billing | In scope | Live Stripe product/payment link or checkout; receipts and refund handling |
| Data/privacy | In scope | Minimum applicant facts, private storage, source provenance, deletion path |
| Legal/trust | In scope | No guarantees, no contingency fee, no invented facts, explicit approval for attestations/signatures/submission |
| Operations/support | In scope | 72-hour first-package target, inbox triage, exception queue, delivery checklist |
| Analytics | In scope | Sent, delivered, replied, profile started/completed, preview viewed, deposit, annual payment, fulfillment time |
| Reliability/recovery | In scope | Broken-link and checkout tests, manual delivery fallback, refund path, audit receipt |
| Accessibility | In scope | Keyboard path, visible focus, readable contrast, plain-language status labels |
| Retention | In scope | Monthly verified match digest, deadline queue, additional package credits |
| Paid ads/social/content | Later | Only after direct evidence of paid conversion |
| Grant consultants | Later | Interview now; multi-client workspace only after primary offer converts |
| Full portal automation | Later | Do not block first revenue on portal integrations |
| Small-business/founder mass market | Later | Keep as secondary wedge, not sprint ICP |
| Award-success pricing | Not applicable | No percentage of awards and no award guarantee |
| New app/SaaS build | Out of scope | Reuse Shinnslist; only minimum offer/checkout changes after approval |

## Program → stages → workstreams → proof

### Stage 0 — Direction lock
**Entry:** market ledger, live-state audit, and scoring complete.  
**Deliverables:** this roadmap; one offer; one ICP; explicit non-goals.  
**Exit gate:** James authorizes replacing the unvalidated public `$29/month` lead offer with the founding offer and authorizes personalized external outreach.  
**Rollback:** retain current live site; nothing public changes.

### Stage 1 — Revenue path
**Workstreams**
1. Offer and terms: founding-plan copy, scope boundaries, guarantee language, privacy/terms consistency.
2. Billing: live Stripe price/deposit path, receipt, webhook/fulfillment state, refund path.
3. Conversion surface: proof-first page and CTA; preserve current free-profile journey.
4. QA: customer checkout, operator receipt, mobile, accessibility, failure states.

**Dependencies:** Stage 0 approval → offer copy → Stripe object → page/checkout wiring → production verification.  
**Exit evidence:** a real low-dollar end-to-end live checkout/refund test or Stripe-approved equivalent; webhook/receipt evidence; screenshot and response-body proof; no unsupported claims.

### Stage 2 — Qualified pipeline
**Workstreams**
1. Rank the IRS pool for likely grant frequency and lack of a dedicated grant department.
2. Enrich official websites and public role-based contact addresses; suppress weak/ambiguous contacts.
3. Build 25-target wave A and 25-target wave B with one relevant official grant/funding angle per prospect.
4. Configure consent-respecting one-to-one outreach and opt-out handling; no deceptive identity or mass-spam behavior.

**Dependencies:** target pool → website verification → contact verification → personalization QA.  
**Exit evidence:** 50 qualified prospects, verified public contact source, fit reason, and personalization note.

### Stage 3 — Proof-first outreach
**Workstreams**
1. Send wave A with a direct promise of a free evidence preview, not a generic demo.
2. Generate each responding organization's truth profile and three source-backed matches.
3. Deliver an exact application preview with unknown facts blocked.
4. Ask for the $99 deposit only after proof is visible; apply it to the $499 annual total.
5. Send one helpful follow-up to nonresponders; suppress opt-outs and bounces.

**Exit evidence:** sent/delivered/replied metrics, preview artifacts, deposits/payments, objection ledger, and no unresolved compliance complaints.

### Stage 4 — Paid delivery and retention
**Workstreams**
1. Complete the first application-ready package within 72 hours of receiving required facts.
2. Obtain customer approval for attestations and final submission requirements.
3. Preserve source, exact answers, status, obligation, and receipt.
4. Start the monthly match/deadline digest and expose remaining package credits.
5. Capture honest feedback; request a testimonial only after actual value delivery.

**Exit evidence:** customer acceptance of the package, payment status, elapsed fulfillment time, approval trail, and delivery receipt.

### Stage 5 — Decision
- **Scale:** paid signal passes; process the next 100 targets and automate the actual bottleneck.
- **Reprice/repackage:** interest exists but deposits do not; test one application-ready package at a lower fixed price.
- **Kill/park:** the threshold is reached with no paid signal; do not continue polishing Shinnslist.

## Critical path and parallel lanes

**Critical path:** authorize offer/outreach → working live payment path → 25 verified prospects → personalized outreach → free previews → deposit → application-ready delivery.  
**Parallel lane A:** shortlist/enrichment can proceed while offer copy and billing are prepared.  
**Parallel lane B:** recruit eight user testers while wave A is sent.  
**Parallel lane C:** prepare fulfillment templates, source/provenance checks, and the customer receipt while the first prospects respond.

## Cross-functional omission review

- **Customer:** proof precedes payment; no call required; clear deliverable and timing.
- **Product/design:** exact unknowns, sources, effort, and approval gates remain legible.
- **Engineering/data:** no dependency on unverified portal automation; manual fallback is defined.
- **Security/privacy:** minimum necessary customer data, private access, deletion, and no credentials in the vault.
- **Legal/compliance:** flat fee only; no award guarantee; final attestations/signatures/submission remain customer-controlled; outreach uses public business contacts and honored opt-outs.
- **Operations/support:** 72-hour capacity is bounded by a limited number of founding slots; exceptions are queued rather than hidden.
- **Growth:** one ICP and one proof-first channel; no paid ads or broad founder positioning.
- **Finance:** upfront cash is meaningful; fulfillment is bounded; refund exposure is explicit.
- **QA/release:** verify customer, operator, billing, failure/recovery, analytics, and production journeys together.

## Requirement-to-proof traceability

| Requirement | Proof |
|---|---|
| First real payment in 7 days | Live Stripe payment/deposit record and receipt |
| Buyer sees value before paying | Prospect-specific match/application preview artifact |
| No bad-fit or fee-trap application | Source-backed eligibility and fee checks |
| Human controls consequential actions | Approval/attestation state and submission receipt |
| James stays under five hours/week | Time log; James only handles direction/legal gates, not fulfillment |
| No unsupported marketing claims | Source ledger plus reviewed published copy |
| Offer is worth continuing | Pass/fail threshold evaluated from actual outreach and deposits |

## Risks and rollback

1. **No trust without a human grant writer:** counter with source transparency, bounded deliverables, concierge review, and no guarantee; do not fabricate credentials.
2. **Cold outreach underperforms:** move to grant consultants and partner channels only after the 50-contact direct test.
3. **Fulfillment takes too long:** cap founding slots and fall back to a paid single-package service.
4. **Checkout or live site breaks:** keep the current page deployable, use a reversible route/feature flag, and retain a standalone Stripe payment link.
5. **Product promise exceeds automation:** state “application-ready package” and use manual operations until real portal integrations are verified.

## Exact next action after authorization

Prepare and verify the live founding offer/checkout, finish the first 25 enriched prospects, then send the proof-first outreach wave. James does not run commands, configure accounts, or join sales calls.
