# Shinnslist Accessibility Audit

**Scope:** All public pages (`/`, `/login`, `/signup`, `/onboarding`, `/post`, `/pricing`, `/zones`, `/welcome`) and shared components (`layout.tsx`, `BottomNav`, `DealFeedClient`, `ListingCard`, `VerticalFilter`, `StatsBar`, `PushPrompt`, `MapClient`).
**Standard:** WCAG 2.2 Level AA (includes 2.5.8 Target Size).
**Method:** Static source review (`src/app`, `src/components`) + computed WCAG contrast ratios (WCAG 2.x formula). No live browser/aXe run performed — dynamic map rendering and JS interactions verified by reading the client components.
**Date:** 2026-08-07 · **Version audited:** v0.2.0 (`6defeb1`)
**No code changes were made.** All findings below are recommendations for approval.

---

## Executive summary

| Area | Result |
|------|--------|
| Semantic HTML / keyboard operability | Mostly good — all primary controls are native `<button>/<a>/<input>/<select>` |
| Color contrast | **2 systemic failures** (muted body text; white-on-pink CTAs) |
| Mobile touch targets | **Several failures** (filter chips, bottom nav, small icon buttons) |
| ARIA / accessible names | 2 missing labels (icon-only buttons) + missing selected-state announcements |
| Form labels & errors | **Failures** — placeholder-only inputs, no programmatic label/error association |
| Focus visibility | Failures — focus ring removed, hover-only button styles |

**Passes worth preserving:** `lang="en"` set; single `h1` per page; headings hierarchy sound; strong contrast for headings/body text (`#F5F0EB` ≈ 17:1); green accent `#39FF14` ≈ 14:1; all error/status colors (red/yellow/green/blue/purple on dark) exceed 4.5:1; `img` alt text present where images exist; external deal links use `target="_blank" rel="noopener noreferrer"`.

---

## 1. Color contrast (WCAG 1.4.3 AA — text ≥ 4.5:1, UI ≥ 3:1)

All ratios computed against the real theme tokens in `src/app/globals.css`.

### 🔴 FAIL — Body / secondary text uses `--shinnslist-muted` (#6B6B7B)

This token is the default body text color (`layout.tsx` line 31) and is used for **most** secondary copy site-wide — descriptions, subheads, card meta, footer, pricing feature lists.

| Background | Contrast |
|-----------|----------|
| `#08080A` (bg) | **3.83:1** ❌ |
| `#111115` (surface) | **3.60:1** ❌ |

**Impact:** Fails AA (needs 4.5:1). Affects every description paragraph, deal-card meta line, footer links, pricing/subtext, onboarding helper text.
**Fix:** Lighten muted token to ≈ `#9A9AAD` or darker (e.g. `#A0A0B3`) so it clears ~4.5:1 on both `bg` and `surface`. Keep as a single token so it fixes globally.

### 🔴 FAIL — White text on pink CTA buttons (#FFFFFF on #FF1493)

Used on every primary CTA: "Go Pro", "Sign in", "Post to Marketplace", "Enable alerts", "Start finding deals →", bottom-nav CTA, pricing "Go Pro".

- Contrast **3.64:1** ❌ (needs 4.5:1 for normal-size text; most of these are `text-sm`/`text-xs` bold, which is still "normal" text).

**Fix options:** (a) darken button background to a pink that reaches 4.5:1 with white (≈ `#C41374`/`#D1086E`), or (b) use black/very-dark text on the current pink (dark-on-pink ≈ 6:1). Option (a) preserves the brand look with white text.

### 🔴 FAIL — `text-zinc-500` (#71717A) on `--shinnslist-surface`

Used for deal-card metadata (`timeAgo`, location, "View deal", border-top labels), `ListingCard` meta row.

- Contrast on `#111115`: **3.90:1** ❌

**Fix:** use `zinc-400` (#A1A1AA, ≈7.4:1 ✓) for secondary card meta.

### 🟡 WARN — Placeholder text `placeholder:text-zinc-600` (#52525B on #08080A = 2.59:1)

Placeholders are not strictly required to pass contrast (they're supplementary to labels), but **if placeholders are also the only hint for a field (they are — see §4), contrast matters**. Replace with a visible `<label>` and keep placeholder ≥ 4.5:1.

### ✅ PASS — verified ratios

| Pair | Ratio |
|------|-------|
| Heading/body `#F5F0EB` on bg / surface | 17.7 / 16.6 :1 ✓ |
| Accent green `#39FF14` on bg / surface | 14.8 / 13.9 :1 ✓ (used for "Live", deal-score high, "instant alerts", road-trip active) |
| Pink text `#FF1493` on bg / surface | 5.50 / 5.18 :1 ✓ (nav active, "Sign up" / "Sign in" links) |
| Error text `#F87171` (red-400) on surface | 6.8 :1 ✓ |
| `zinc-400` on surface | 7.35 :1 ✓ |
| Black on green-500 "FREE" badge | 9.2 :1 ✓ |
| yellow/blue/purple/orange/teal accents on dark | 7–13 :1 ✓ |

---

## 2. Mobile touch targets (WCAG 2.2 2.5.8 AA — 24×24 min with 24px spacing; Apple HIG / common practice 48×48)

The project sets an `h-16` (64px) bottom nav, which is a good container — but **individual hit areas fall well under 48px tall**.

| Element | Approx. hit size | Status |
|---------|-----------------|--------|
| **BottomNav links** (`BottomNav.tsx`) — icon(18px)+label(10px)+dot ≈ 36px tall | ~36×~48px | 🔴 <48px tall |
| **Filter chips** "All/FREE/Hot/Trending/Quality" (`DealFeedClient`) `px-3 py-1.5 text-xs` | ~27px tall | 🔴 |
| **Vertical filter chips** (`VerticalFilter.tsx`) `px-3 py-1.5 text-xs` | ~28px tall | 🔴 |
| **PushPrompt dismiss "×"** (`PushPrompt.tsx`) `text-lg` bare button | ~24×24px | 🔴 below 44px |
| **PushPrompt "Enable alerts"** `py-2 text-xs` | ~30px tall | 🔴 |
| **Platform selector** (post) `py-2` | ~36px tall | 🔴 |
| **"Draw Zone" / "Road Trip" / "Add State" / "Try Road Trip"** (`zones`) `py-1.5` | ~28px tall | 🔴 |
| **Zone-chip remove "×"** (`zones`) | ~16px | 🔴 |
| Onboarding category cards `p-4` | large | ✅ |
| Onboarding interest cards `p-3` | ~50px | ✅ |
| Primary submit buttons `py-3`/`py-4` full-width | 44–52px, full width | ✅ |

**Fix:** apply `min-h-11` (44px) or `min-h-12` (48px) to chip/button classes; add a larger hit area / padding to the `×` dismiss and zone-remove buttons.

---

## 3. ARIA / accessible names (WCAG 4.1.2 Name, Role, Value)

### 🔴 FAIL — Icon-only buttons with no accessible name
- **PushPrompt dismiss button** (`PushPrompt.tsx` line 111): contains only `×`. No `aria-label="Dismiss notification"`.
- **Zone remove button** (`zones/page.tsx` line 95): contains only `×`. No `aria-label="Remove {zone.name}"`.

### 🔴 FAIL — Toggle/selection state not announced
Many stateful buttons communicate selection **visually only** (border/bg color), with no `aria-pressed` / `aria-selected` / `role="tablist"`:
- Filter chips (All/FREE/…), `VerticalFilter` chips, onboarding category & interest cards, post platform selector, "Road Trip" toggle, "Draw Zone" toggle.

A screen reader user cannot tell which option is active. **Fix:** add `aria-pressed={isActive}` on each toggle button (or convert the filter groups to `role="radiogroup"` / tabs).

### 🟡 INFO — Emoji icons (`🆓`, `📦`, category emoji, stats icons) are decorative and sit next to real text → acceptable as-is. The deal card `<a>` derives its name from the title → OK.

---

## 4. Form labels & error messages (WCAG 3.3.1, 3.3.2, 1.3.1)

### 🔴 FAIL — Inputs rely on `placeholder` only, no programmatic label
- **Login** (`login/page.tsx`): Email and Password fields — placeholder only.
- **Onboarding** (`onboarding/page.tsx`): email field — placeholder only.
- **Post** (`post/page.tsx`): title and price fields — placeholder only.
- **Zones** (`zones/page.tsx`): the state `<select>` has no label or `aria-label`.

**Fix:** add visible `<label htmlFor>`/`<label for>` or `aria-label` on each. `for`/`id` pairing is best.

### 🔴 FAIL — Error messages not programmatically associated / announced
- Errors render as plain `<p>` (login/onboarding/post), not wired to the offending input via `aria-describedby` and not `role="alert"`/`aria-live`. Screen readers won't announce them. (Error text color passes contrast — see §1.)
- **Post** "Tap to take a photo": the whole upload area is a `<div onClick>` with a `display:none` file input → **not keyboard accessible** and not announced as a button (see §5).

---

## 5. Keyboard navigation & focus (WCAG 2.1.1, 2.4.7 AA)

**Good news:** All primary actions are native `<button>`/`<a>`/`<select>` — Tab/Enter/Space work out of the box. No custom click-divs for the main flows.

### 🔴 FAIL — Photo-upload trigger is not keyboard accessible (`post/page.tsx`)
The upload area is a `<div onClick={() => fileInputRef.current?.click()}>` with a visually-hidden `<input class="hidden">`. Not focusable, no role, no Enter/Space handling. **Fix:** make it a `<label>` wrapping the file input (natively focusable & activate-able), or add `role="button" tabIndex={0}` + key handler + `aria-label`.

### 🔴 FAIL — No visible focus indicator on most controls (2.4.7)
- Inputs use `focus:outline-none` + `focus:border-pink` (acceptable — border color change, but contrast is thin; consider `focus-visible` ring).
- **Buttons** have only `hover:` styles, no `focus-visible:` — the default outline is suppressed and nothing replaces it. Keyboard users get no focus indication.

**Fix:** add a global `:focus-visible` outline / ring (e.g. Tailwind `focus-visible:ring-2 focus-visible:ring-[var(--shinnslist-pink)]`) on all interactive elements.

### 🟡 WARN — No "Skip to content" link (WCAG 2.4.1, Level A)
The sticky header precedes `<main>`; a skip link would help keyboard users. Low effort, high value.

### 🟡 WARN — BottomNav `localStorage` read gates a nav item (`hasPreferences`)
Not an a11y failure per se, but nav content changes client-side after hydration; acceptable.

---

## 6. Per-page quick reference

| Page | Key issues |
|------|-----------|
| **/** (Deal Feed) | muted body text; white-on-pink CTAs; filter & vertical chips <48px; chip selection not announced; `zinc-500` meta; no focus styles; no skip link |
| **/login** | placeholder-only inputs; error `<p>` not associated; white-on-pink submit; focus-visible |
| **/signup** | white-on-pink "Get started"; no form fields (ok); focus-visible |
| **/onboarding** | placeholder-only email; category/interest buttons missing `aria-pressed`; chips <48px (category cards ok); error not announced; focus-visible |
| **/post** | photo-upload div not keyboard-accessible; title/price placeholder-only; platform selector <48px & no selected-state; error not announced |
| **/pricing** | white-on-pink "Go Pro"; muted feature text; add-on rows fine (non-interactive); "Terms apply" `href="#"` dead link (4.1.2/a11y for screen-reader affordance) |
| **/zones** | state `<select>` unlabeled; "×" remove buttons unlabeled & <44px; "Draw Zone"/"Road Trip" toggles <48px & no `aria-pressed`; map interactions (Leaflet draw) largely mouse-dependent |
| **/welcome** | muted text; otherwise minimal interactive content — good |

---

## 7. Priority action plan (recommended order)

1. **Fix global tokens** — lighten `--shinnslist-muted` and pink CTA bg; swap `zinc-500`→`zinc-400` for card meta. (Single-token fixes, biggest AA win.)
2. **Add form labels** — `<label for>`/`aria-label` on login, onboarding, post inputs, zones select.
3. **Wire errors** — `role="alert"` / `aria-describedby` on login/onboarding/post error messages.
4. **Add `aria-pressed`** to all stateful toggle buttons (filters, verticals, platform, onboarding cards, road-trip/draw).
5. **Fix touch targets** — `min-h-11/12` on chips & small buttons; pad the `×` dismiss/remove buttons.
6. **Make photo-upload keyboard-accessible** — convert `<div>` to `<label>`.
7. **Restore visible focus** — global `:focus-visible` ring; drop `focus:outline-none` where no replacement exists.
8. **Name icon-only buttons** — `aria-label` on PushPrompt dismiss and zone remove.
9. *(Nice-to-have)* Skip-to-content link; replace dead `href="#"` links (Privacy/Terms/Terms-apply).

---

## 8. Verification note

This audit is based on **static source inspection** plus computed contrast ratios. For a release gate, recommend running **axe-core / Lighthouse** against a running build, and manually Tab-testing `/post` (photo upload), `/login` (error announcement), and `/zones` (draw controls) with a screen reader (NVDA/VoiceOver). Contrast numbers above were computed with the standard WCAG formula from the exact hex tokens in `src/app/globals.css`.
