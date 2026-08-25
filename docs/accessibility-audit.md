# Shinnslist Accessibility Audit — v2 (2026-08-09)

**Scope:** ALL routes (`/`, `/login`, `/signup`, `/onboarding`, `/post`, `/pricing`, `/top-deals`, `/zones`, `/welcome`, `/how-it-works`, `/vision`, `/privacy`, `/terms`, 404) + shared components (`layout.tsx`, `BottomNav`, `PushPrompt`, `DealFeedClient`, `TopDealCard`, `ErrorBoundary`/`EmptyState`, `Skeletons`).
**Standard:** WCAG 2.2 Level AA (text ≥ 4.5:1, UI ≥ 3:1, target size 24×24 with spacing / 48×48 common practice).
**Method:** Static source review of `src/app` + `src/components`; all contrast ratios computed with the WCAG formula against the **current** tokens in `src/app/globals.css` (palette was remapped since the 08-07 audit — `--shinnslist-pink` is now `#22C55E` green, `--fa-*` purple/blue theme added). No live browser/aXe run. **No code changes were made.**
**Date:** 2026-08-09 · Supersedes `accessibility-audit.md` v1 (2026-08-07).

---

## Executive summary

| Area | Result |
|------|--------|
| Semantic HTML / keyboard operability | **Good** — all primary controls are native `<button>/<a>/<input>/<select>`; photo upload is now keyboard-accessible (`role="button" tabIndex=0` + Enter/Space) |
| Global focus ring + reduced motion | **FIXED since v1** — `:focus-visible` outline and `prefers-reduced-motion` block added to `globals.css` |
| Muted text contrast | **FIXED since v1** — `--shinnslist-muted` lightened `#6B6B7B` → `#8B7BA8`; now 5.10:1 on bg, 4.78:1 on surface ✓ |
| Mobile touch targets | **Mostly fixed** — bottom nav, header, primary CTAs are 48px; **remaining fails**: zone-remove ×, push-prompt dismiss ×, pricing vertical buttons, onboarding project chips, vision Retake |
| **White-on-green CTAs** | **🔴 NEW systemic FAIL** — `--shinnslist-pink` remapped to `#22C55E`; every `bg-[var(--shinnslist-pink)] text-white` button is now **2.28:1** |
| **Blue CTA band** | **🔴 NEW FAIL** — `text-blue-200` on `bg-[var(--fa-blue)]` = 2.59:1 |
| **Active vertical pill** | **🔴 NEW FAIL** — `text-[var(--fa-purple)]` on purple/30 tint = 1.99:1 |
| ARIA / accessible names | 3 icon-only buttons unnamed; toggle states (filters, platform, onboarding, draw/road-trip) not announced |
| Form labels & errors | **Failures** — placeholder-only inputs on login/onboarding/post; zones `<select>` unlabeled; error `<p>` not wired to `role="alert"`/`aria-describedby` |
| Dead components | `SearchBar`, `ListingCard`, `StatsBar`, `TrendingSection`, `VerticalFilter` are **not imported by any page** — their issues don't ship, but don't wire them in without fixing |

**Passes worth preserving:** `lang="en"`; single `h1` per page; sound heading hierarchy; `img alt` present everywhere (incl. blurred lock cards); external links `target="_blank" rel="noopener noreferrer"`; native controls everywhere; `required` on auth fields; `.touch-target` (48px) helper class exists.

---

## 1. Color contrast (WCAG 1.4.3 AA)

All ratios computed against current tokens: `--fa-bg #0F0A1A`, `--fa-surface #1A1028`, `--fa-text #F5F0EB`, `--fa-muted #8B7BA8`, `--fa-green #22C55E`, `--fa-green-bright #4ADE80`, `--fa-gold #F59E0B`, `--fa-blue #3B82F6`, `--fa-purple #6B3FA0`, `--fa-purple-dark #4A1D7A`, `--shinnslist-pink = #22C55E` (green).

### 🔴 FAIL — White text on `--shinnslist-pink` (#22C55E) = **2.28:1** (need 4.5:1)

The palette remap turned every "pink" CTA into green-on-white-text. Affected (all `bg-[var(--shinnslist-pink)] text-white`):
- `/login` submit "Sign in", `/signup` "Get started", `/onboarding` Continue ×2 + "Start finding deals", `/post` "🚀 Post to Marketplace", `/welcome` "View Deal Feed", `/vision` "Unlock subscriptions" + "Analyze deal", `/not-found` "View Deal Feed", `/top-deals` "Unlock the top deals" + TopDealCard "Unlock this vertical", `PushPrompt` "Enable alerts", `ErrorBoundary` "Try again", pricing "Go Pro" + "MOST POPULAR" badge, `TrendingSection` progress bar (dead), header Go Pro is the **only** CTA already correct (`bg-[var(--fa-green)] text-black` = 9.22:1 ✓).

**Fix (one pattern, site-wide):** switch these buttons to `text-black` (black on `#22C55E` = 9.22:1 ✓ — matches the existing header button) **or** darken the CTA token to ≈ `#15803D`/`#16A34A` so white passes 4.5:1. The `text-black` option is a one-class change per button and keeps the current green brand.

### 🔴 FAIL — Blue CTA band (`DealFeedClient` bottom section, `bg-[var(--fa-blue)] #3B82F6`)
| Text | Ratio | Notes |
|------|-------|-------|
| `text-blue-200` body copy ("Get notifications…") | **2.59:1** ❌ | needs 4.5:1 |
| `text-blue-200/70` ("🔒 Cancel anytime") | **1.97:1** ❌ | |
| white "Set up zones" ghost button | 3.68:1 ⚠️ | fails AA for text-sm |

**Fix:** use white (`#FFF` on blue = 3.68 — still short for normal text) → lighten section bg to a darker blue (e.g. `#1D4ED8` = white 6.5:1) or darken the copy to `blue-100`/white with a darker band.

### 🔴 FAIL — Active vertical pill (`DealFeedClient` line 351): `text-[var(--fa-purple)]` on `bg-[var(--fa-purple)]/30` = **1.99:1** ❌ (purple text on purple tint; also 2.48:1 on plain surface)
**Fix:** active state → white text (white on purple/30 = 13–14:1 ✓) or a light purple (`#C4B5FD`-class).

### ⚠️ WARN — Hero gradient text (`DealFeedClient` hero)
- `text-white/70` paragraph: 6.62:1 over purple-dark, 4.52:1 over purple (left column = OK), **2.59:1 over the blue stop** (right edge).
- Stats labels `text-white/60`: 3.77:1 over purple, **2.28:1 over blue**.
**Fix:** bump to `text-white/80`+ or darken the blue end of `--fa-hero-gradient`.

### ⚠️ WARN — `zinc-500` (#71717A) card meta
`timeAgo`, location, "View deal", `ListingCard` meta row: 3.78:1 on surface, 4.03:1 on bg — under 4.5:1 for the small text it carries.
**Fix:** swap to `zinc-400` (#A1A1AA = 7.13:1 ✓).

### ❌/⚠️ — Placeholder-only inputs (`placeholder:text-zinc-600` #52525B on bg = **2.52:1**)
Placeholders are supplementary, **but** on login/onboarding/post they are the *only* field hint — see §4. A real `<label>` fixes both label and contrast requirement.

### ✅ PASS — verified ratios (current tokens)
| Pair | Ratio |
|------|-------|
| `#F5F0EB` on bg / surface | 17.19 / 16.15 :1 ✓ |
| `#8B7BA8` muted on bg / surface | 5.10 / 4.78 :1 ✓ (**fixed since v1**) |
| Black on `#22C55E` green | 9.22 :1 ✓ (header Go Pro — the correct pattern) |
| `#4ADE80` green-bright on bg / surface | 11.17 / 10.49 :1 ✓ |
| `#F59E0B` gold on bg / surface | 9.07 / 8.51 :1 ✓ |
| `#3B82F6` blue as *text* on bg / surface | 5.29 / 4.97 :1 ✓ |
| `#F87171` red-400 error text on surface | 6.61 :1 ✓ |
| `#FACC15` yellow-400 on surface | 11.94 :1 ✓ |
| White on `#4A1D7A` / `#6B3FA0` | 12.01 / 7.38 :1 ✓ |
| Chip tints (orange-400, blue-400, green on 15% tint) | 6.04–7.91 :1 ✓ |
| Black on gold score badge | ≈9.8 :1 ✓ (computed; also white on zinc-600/80 ≈ 5+:1 ✓) |

---

## 2. Mobile touch targets (WCAG 2.2 2.5.8 / 48px practice)

### ✅ FIXED since v1
- **BottomNav** links: `min-h-[48px] min-w-[48px] touch-target` ✓ (was ~36px)
- **Header** links + Go Pro: `min-h-[48px]` ✓
- **Deal feed filter pills & vertical pills**: `min-h-[40px]` + `.touch-target` (48px) ✓ — note: relies on `.touch-target` beating the Tailwind utility in source order; fragile, prefer `min-h-[48px]` directly.
- **zones** select / Draw Zone / Road Trip: `min-h-[48px]` ✓
- **post** photo area (large), title/price inputs, platform selector, submit: 48px ✓ (platform selector was 36px in v1 — fixed)
- **login/signup/onboarding** primaries: `min-h-[48px]` ✓

### 🔴 Still failing (all < 48px; several are icon-only)
| Element | Hit size |
|---------|----------|
| Zone remove **×** (`zones/page.tsx:101`) | ~16–20px |
| PushPrompt dismiss **×** (`PushPrompt.tsx:113`) | ~24×24px |
| PushPrompt **"Enable alerts"** (`py-2 text-xs`) | ~30px tall |
| Pricing vertical unlock buttons (`min-h-[40px]`) | 40px |
| Onboarding project chips (`px-3 py-1.5`) | ~28px |
| Vision **Retake** (`px-3 py-1.5`) | ~30px |
| DealFeed search clear **✕** | ~24px |

**Fix:** `min-h-11`/`min-h-12` on the above; add padding/hit-area to the × buttons; add `aria-label` while there (§3).

---

## 3. ARIA / accessible names (WCAG 4.1.2)

### 🔴 FAIL — Icon-only buttons with no accessible name
- `PushPrompt` dismiss × (`PushPrompt.tsx:113`)
- Zone remove × (`zones/page.tsx:101`)
- DealFeed search clear ✕ (`DealFeedClient.tsx:311`)
Add `aria-label="Dismiss notification"` / `aria-label="Remove {zone.name}"` / `aria-label="Clear search"`.

### 🔴 FAIL — Toggle/selection state not announced (visually-only)
No `aria-pressed`/`aria-selected`/`role="tablist"` on: deal feed filter pills + vertical pills, onboarding category & interest cards, post platform selector, zones "Draw Zone" and "Road Trip" toggles, pricing add-on rows. A screen reader can't tell which option is active.

### 🟡 INFO — Acceptable as-is
- Emoji icons sit adjacent to real text → decorative, fine.
- Deal card links derive names from title text → fine.
- BottomNav has `aria-current="page"` ✓.
- Post photo upload now has `role="button" tabIndex={0}` + Enter/Space handling ✓ (its visible text supplies the name; a dedicated `aria-label` would be cleaner but not required).

---

## 4. Form labels & error messages (WCAG 3.3.1, 3.3.2, 1.3.1)

### 🔴 FAIL — Placeholder-only inputs, no programmatic label
- `/login`: Email, Password
- `/onboarding`: email field (step 3)
- `/post`: title, price
- `/zones`: state `<select>` — no label or `aria-label` at all

**OK:** onboarding projects `<textarea>` has `<label htmlFor="projects-input">` ✓; vision price-tag has `<label htmlFor="price-tag">` ✓. **Fix:** add visible `<label htmlFor>` (or `aria-label`) to the failing fields.

### 🔴 FAIL — Error messages not programmatically associated / announced
Errors are plain `<p>` in login, onboarding, post, vision, pricing — not `role="alert"`/`aria-live`, not `aria-describedby`-linked to the offending input. Screen readers won't announce them. (Error red text passes contrast — §1.)

---

## 5. Keyboard navigation & focus (WCAG 2.1.1, 2.4.7)

**Good:** every primary action is a native control; Tab/Enter/Space work. **Fixed since v1:** global `:focus-visible { outline: 2px solid var(--shinnslist-pink) }` in `globals.css`; photo-upload trigger is now keyboard-operable; `prefers-reduced-motion` respected.

### 🟡 WARN — No skip-to-content link (WCAG 2.4.1, Level A)
Sticky header precedes `<main>`. Low-effort, high-value: add a visually-hidden skip link as the first focusable element in `layout.tsx`.

### 🟡 WARN — Zones map drawing is mouse-dependent
`MapClient` (Leaflet draw) is pointer-driven; keyboard users can set state + enable draw mode but can't trace a polygon. Acceptable for v1; note as known limitation. Provide `role="region"`/`aria-label="Interactive map"` on the map container.

### 🟡 WARN — Live-region announcements
Deal feed auto-refresh, "Posted!" success, and pricing "Opening checkout…" state changes aren't announced (`aria-live`). Not strictly required but improves the SR experience on the two async flows.

---

## 6. Per-page quick reference

| Page | Key issues |
|------|-----------|
| **/** (Deal Feed) | white-on-green CTAs; blue CTA band (blue-200 on blue); active vertical pill purple-on-purple 1.99:1; search-clear ✕ unnamed & small; hero white/60–70 over blue stop; no skip link |
| **/login** | placeholder-only inputs; error `<p>` not announced; white-on-green submit |
| **/signup** | white-on-green "Get started"; otherwise clean |
| **/onboarding** | placeholder-only email; cards missing `aria-pressed`; project chips <48px; error not announced; white-on-green CTAs |
| **/post** | placeholder-only title/price; photo upload OK now (role=button, tabIndex); platform selector lacks selected-state announcement; white-on-green submit; error not announced |
| **/pricing** | white-on-green "Go Pro" + "MOST POPULAR" badge; vertical unlock buttons 40px; add-ons lack `aria-pressed`; error not announced; otherwise good contrast |
| **/top-deals** | white-on-green "Unlock" buttons (TopDealCard 44px — OK per 2.5.8); card chips pass contrast; blurred-lock CTA band OK |
| **/zones** | `<select>` unlabeled; zone-remove × unnamed & ~16px; draw/road-trip toggles no `aria-pressed`; map pointer-only |
| **/welcome** | white-on-green CTA; otherwise minimal — good |
| **/how-it-works** | clean; CTAs ~44px (OK) |
| **/vision** | locked state fine; Retake button ~30px; error not announced; share/scan buttons 44px (OK) |
| **/privacy, /terms** | static text — good (muted passes) |
| **404** | white-on-green CTA; otherwise fine |

---

## 7. Priority action plan (recommended order — no code changed yet)

1. **Kill the white-on-green CTA failure** — one pattern: `text-white` → `text-black` on every `bg-[var(--shinnslist-pink)]` button (matches existing header button), or darken the token. Biggest AA win, ~15 touchpoints.
2. **Fix the blue CTA band** — darken `--fa-blue` band or swap copy to white/blue-100 on a darker blue.
3. **Fix active vertical pill** — white text on active pill (or light purple).
4. **Name icon-only buttons** — `aria-label` on the three × / ✕ buttons (PushPrompt, zones, search clear).
5. **Add form labels** — `<label for>`/`aria-label` on login, onboarding email, post title/price, zones select.
6. **Wire errors** — `role="alert"` + `aria-describedby` on login/onboarding/post/vision/pricing errors.
7. **Add `aria-pressed`** to all stateful toggles (filters, verticals, platform, onboarding cards, draw/road-trip, pricing add-ons).
8. **Finish touch targets** — 48px on zone-remove ×, push dismiss × + Enable alerts, pricing vertical buttons, onboarding chips, vision Retake.
9. *(Nice-to-have)* Skip-to-content link; `zinc-500` → `zinc-400` card meta; hero text to `white/80`; `aria-label` + `role="region"` on zones map; `aria-live` on feed refresh/success.

---

## 8. Verification note

Contrast numbers are computed from the exact current hex tokens in `src/app/globals.css` (WCAG 2.x formula) — the palette changed since v1, so v1's numbers are obsolete. For a release gate, run **axe-core / Lighthouse** against a running build (`npm run dev`) and manually Tab-test `/login` (label + error announcement), `/post` (photo upload), `/zones` (draw toggle, select) with VoiceOver/NVDA. Dead components (`SearchBar`, `ListingCard`, `StatsBar`, `TrendingSection`, `VerticalFilter`) are not shipped, but fix them before any future wiring.
