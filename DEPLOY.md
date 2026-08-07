# Shinnslist — Deploy Guide

Zero to live in ~30 minutes. Every command you need.

---

## Step 1: Supabase (database + auth)

### Create project
1. Go to https://supabase.com → New project
2. Name: `shinnslist`, password: generate & save
3. Region: US West (closest to Denver)
4. Wait for DB to provision (~2 min)

### Run the migration
1. In Supabase dashboard → SQL Editor → New query
2. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run

### Enable auth providers
1. In Supabase → Authentication → Providers
2. Enable **Email** (default)
3. Enable **Google** — you'll need a Google OAuth client ID (free, 5 min setup: https://console.cloud.google.com)
4. For now, Email + Magic Link is enough

### Get the keys
1. Supabase → Settings → API
2. Copy these into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Step 2: Stripe (payments)

### Create account
1. Go to https://stripe.com → Sign up
2. Skip the business details for now — activate later
3. Switch to **Test mode** (toggle in top-right of dashboard)

### Create products & prices
You need these Stripe products (weekly pricing):

| Product | Price ID (test) | Amount |
|---------|----------------|--------|
| Shinnslist Pro — Weekly | `price_pro_weekly` | $5.00/wk |
| Pro Flipper — Weekly | `price_pro_flipper_weekly` | $20.00/wk |
| Instant Alerts (add-on) | `price_addon_instant` | $3.00/wk |
| Additional State (add-on) | `price_addon_state` | $1.00/wk |
| Research & Comps (add-on) | `price_addon_research` | $4.00/wk |
| Data Export (add-on) | `price_addon_export` | $5.00/wk |
| Email Digest (add-on) | `price_addon_digest` | $2.00/wk |
| Whole Country (add-on) | `price_addon_country` | $8.00/wk |
| Road Trip (add-on) | `price_addon_roadtrip` | $3.00/wk |

1. Stripe Dashboard → Products → Add product
2. Set **Recurring** → Weekly
3. Copy the price ID (starts with `price_`)
4. Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_WEEKLY_PRICE_ID=price_xxx
STRIPE_PRO_FLIPPER_PRICE_ID=price_xxx
STRIPE_ADDON_INSTANT_PRICE_ID=price_xxx
# (etc for each add-on)
```

### Webhook setup
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://shinnslist.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: Cloudflare Pages (hosting)

> **Policy (James, 2026-08-07): NO Vercel. Cloudflare Pages only.**

### Deploy
```bash
# Prereq: Cloudflare account already logged in via Google (jamesrshinn@gmail.com)
# Build locally first to catch errors:
cd ~/projects/freebie
npm run build

# Option A — wrangler CLI (fastest for automation)
npm i -g wrangler
wrangler login   # opens browser, click Cloudflare (already logged in)
wrangler pages project create shinnslist --production-branch main
wrangler pages deploy out --project-name shinnslist

# Option B — dashboard (manual)
# Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
# (or: Upload assets from the `out/` directory after `next build`)
```

### Set environment variables
1. Cloudflare Dashboard → Workers & Pages → shinnslist → Settings → Environment Variables
2. Add ALL variables from `.env.local` (Production + Preview)
3. Redeploy: `wrangler pages deploy out --project-name shinnslist`

**Note for Next.js:** static export works with Cloudflare Pages. If using SSR/API routes, use `@opennextjs/cloudflare` instead of plain `next build`.

---

## Step 4: Domain (shinnslist.com on Cloudflare)

### Point to Cloudflare Pages
1. Cloudflare Dashboard → Workers & Pages → shinnslist → Custom domains
2. Add `shinnslist.com` and `www.shinnslist.com`
3. Cloudflare auto-creates the DNS records (Pages handles SSL)

**Note:** Everything stays inside Cloudflare — Pages hosting + DNS + SSL. No Vercel.

---

## Step 5: Verify everything works

```bash
# 1. Visit shinnslist.com — should show pink deal feed with mock data
# 2. Click "Go Pro" → should go to Stripe checkout (test mode)
# 3. Test payment: use Stripe test card 4242 4242 4242 4242
# 4. After payment, should redirect to /welcome
# 5. Check Supabase → users table has a new row
# 6. Run the scraper manually:
cd ~/projects/freebie
npx ts-node --skip-project workers/craigslist.ts
# 7. Refresh the homepage — real Craigslist listings should appear
```

---

## Scraper cron — auto-running

A cron job is already configured in Hermes to run every 30 minutes:
- Scrapes Craigslist free stuff (4 CO cities)
- Scores listings with heuristic engine
- Inserts into Supabase

To check it: `cronjob list` in Hermes, or check Supabase listings table.

---

## Access for mobile

Once deployed, visit `shinnslist.com` on your iPhone/Android:
- Tap Share → "Add to Home Screen"
- Opens as a standalone PWA with push notifications
- Give notification permission → alerts land like native app

---

## What works without keys

| Feature | Status | Needs |
|---------|--------|-------|
| Homepage deal feed | ✅ (mock data) | Supabase URL |
| Vertical filters | ✅ | — |
| Heuristic deal scores | ✅ | — |
| Pricing page | ✅ (static) | Stripe keys for checkout |
| Auth (login/signup) | ✅ (ready) | Supabase URL |
| Leaflet map zones | ✅ | — (free OSM tiles) |
| Push notifications | ✅ (ready) | HTTPS (Vercel auto) |
| Craigslist scraper | ✅ (manual) | — |
| Supabase inserts | ✅ (ready) | Supabase keys |

---

## Revenue flow (once live)

```
User visits → sees deals → sees deal scores → FOMO
  → clicks "Go Pro $5/week"
  → Stripe checkout (card)
  → redirect /welcome
  → Supabase user.created → subscription = 'pro'
  → Instant alerts enabled → push notifications start
  → Add-ons shown at checkout → per-use stripe metering
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | `rm -rf .next node_modules && npm install && npm run build` |
| Stripe 401 | Check `STRIPE_SECRET_KEY` starts with `sk_test_` |
| Supabase 401 | Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key, not service role |
| Scraper 0 listings | Craigslist may have changed HTML. Run `curl` to check. |
| Push not working | Must be HTTPS (Vercel auto). Check VAPID keys in env. |
