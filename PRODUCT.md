# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are small-business owners, nonprofit operators, and under-resourced founders who qualify for grants but do not have time, expertise, or staff to repeatedly find and complete applications. They need to know which grants are real, whether they qualify, what is due next, and exactly what will be submitted in their name.

## Product Purpose

Shinnslist is a grant autopilot. It continuously discovers and verifies grants, matches each opportunity to a reusable applicant profile, drafts a tailored application, presents the completed draft for review, and submits only after the applicant approves it. Success is measured by qualified applications submitted, dollars requested, deadlines met, and awards won—not by links collected.

## Positioning

Most grant directories stop at search results and most chatbots stop at prose. Shinnslist keeps a persistent eligibility and narrative profile, turns verified matches into complete application previews, and carries approved applications through the real browser workflow. The product is the operating loop: discover → qualify → draft → preview → approve → submit → track.

## Operating Context

Users build one private applicant profile from business facts, ownership and demographic eligibility, location, financial range, mission, history, reusable narratives, and supporting documents. Shinnslist checks live grant sources, blocks ineligible or fee-based opportunities, scores match and effort, creates a deadline queue, and prepares each application. Users review the exact answers and attestations before submission. Email or SMS can surface a ready-to-review draft, but the same approval gate controls every channel.

## Capabilities and Constraints

- Grant discovery must use current, official sources and preserve source URLs, deadlines, eligibility, fees, and verification dates.
- Hard eligibility screening happens before drafting; the product does not shotgun applications.
- Every application is tailored to the funder and capped at one submission per funder per cycle.
- Real identity only. The user must approve legal attestations, signatures, SSN/EIN entry, paid fees, and final external submission when a funder requires a human action.
- The default product flow is preview-then-submit. Draft previews are free; credits are charged only when an application is approved for submission.
- Pricing is $29/month for matching, tracking, and drafting, with submission credits at $10 for 10 or $25 for 30. Human expert review is a later optional add-on.
- The product runs on Next.js static export, Cloudflare Pages/Functions/Workers, Supabase, Stripe, and Cloudflare Browser Run/Kitesurf. Web deployments use Cloudflare Pages only.
- Existing marketplace-deal features are legacy and are not part of the grant-autopilot product direction.

## Brand Commitments

- Name: Shinnslist.
- Voice: direct, calm, specific, credible, and action-oriented; never hypey, bureaucratic, or AI-theater.
- The product must make users feel protected from ineligible applications, missed deadlines, repetitive forms, and fee traps.
- Existing near-black foundation may remain only where it supports clarity; green is reserved for eligibility, readiness, and completed progress—not generic decoration.

## Evidence on Hand

- Product and pricing decisions: `/Users/jamesshinn/life/_system/money/product-grant-autopilot.md`.
- Current grant tracker and drafted applications: `/Users/jamesshinn/life/_system/money/grant-tracker.md` and `/Users/jamesshinn/life/_system/money/grant-applications/`.
- Fresh researched grants with official URLs and verification metadata: `/Users/jamesshinn/life/_system/money/grants-research-fresh.json`.
- Cloudflare Kitesurf Browser Run verified live against shinnslist.com; its token is stored in macOS Keychain under `cloudflare-kitesurf-token`.
- No customer testimonials, award-rate claims, or public usage benchmarks are available and none may be fabricated.

## Product Principles

1. Applications, not directories: every matched grant should move toward a complete submission.
2. Eligibility before effort: block bad fits and fee traps before consuming user time or credits.
3. Preview before permission: show the exact application before approval or charge.
4. Persistent truth, tailored output: reuse verified applicant facts while rewriting every narrative for the funder.
5. Human authority at real gates: automation handles repetition; the applicant controls attestations, signatures, money, and final submission requirements.

## Accessibility & Inclusion

The interface must meet WCAG 2.1 AA, work well on mobile, use plain language for complex eligibility requirements, never rely on color alone for status, and clearly distinguish verified facts, inferred matches, missing information, and user attestations.
