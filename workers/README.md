# Shinnslist — Standalone Cloudflare Workers

The Next.js API routes were removed from the static build. Each is now a standalone
Cloudflare Worker with its own `wrangler.toml`. All are deployed to the
`jamesrshinn@gmail.com` account (Account ID `26cb8b771f26e2b269f6bf810221f1b5`).

| Worker dir            | Replaces (Next route)                    | workers.dev URL                                              |
|-----------------------|------------------------------------------|---------------------------------------------------------------|
| `checkout/`           | `src/app/api/checkout`                   | `https://shinnslist-checkout.jamesrshinn.workers.dev`          |
| `listings/`           | `src/app/api/listings`                   | `https://shinnslist-listings.jamesrshinn.workers.dev`          |
| `push/`               | `src/app/api/push`                       | `https://shinnslist-push.jamesrshinn.workers.dev`              |
| `webhooks-stripe/`    | `src/app/api/webhooks/stripe`            | `https://shinnslist-stripe-webhook.jamesrshinn.workers.dev`    |
| `auth-callback/`      | `src/app/auth/callback`                  | `https://shinnslist-auth-callback.jamesrshinn.workers.dev`     |

Deploy a worker: `cd workers/<name> && npx wrangler deploy`

---

## Required secrets (NOT in `wrangler.toml`)

The real credentials live in `.env.local` but are currently **empty placeholders**.
Set them once real keys exist. Each secret is set per-worker with:

```bash
cd workers/<name> && npx wrangler secret put <NAME>
```

| Worker            | Secrets needed (status 2026-08-09)                                     |
|-------------------|-----------------------------------------------------------------------|
| `checkout`        | `STRIPE_SECRET_KEY` (`sk_...`) — **NOT SET** (key not provisioned yet) |
| `listings`        | `SUPABASE_SERVICE_ROLE_KEY` ✅, `ADMIN_API_SECRET` ✅ (generated)        |
| `push`            | `ADMIN_API_SECRET` ✅ (generated); `VAPID_PRIVATE_KEY` — **NOT SET** (private key never saved; public key is a `[vars]` entry) |
| `webhooks-stripe` | `SUPABASE_SERVICE_ROLE_KEY` ✅; `STRIPE_WEBHOOK_SECRET` (`whsec_...`) — **NOT SET** |
| `auth-callback`   | (none — Supabase URL + anon key are `[vars]`) ✅                       |

Non-secret vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`STRIPE_PRO_PRICE_ID`, `STRIPE_FLIPPER_PRICE_ID`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) are in each worker's `wrangler.toml` `[vars]` and
are filled with real values (`NEXT_PUBLIC_SUPABASE_URL`, anon key, and
`NEXT_PUBLIC_APP_URL=https://shinnslist.com`). `ADMIN_API_SECRET` was generated and
appended to `.env.local` (gitignored).

## Wire to the frontend

The live frontend (`https://shinnslist.pages.dev`) calls **relative** paths
(`/api/checkout?tier=pro`, `/api/push`, `/api/listings`, `/api/webhooks/stripe`,
`/auth/callback`). To serve these workers at those paths you need the custom-domain
routes. Once `shinnslist.com` is on the same Cloudflare account, uncomment the
`routes = [...]` block in each `wrangler.toml` and re-deploy:

- `shinnslist.com/api/checkout`  → `checkout` worker
- `shinnslist.com/api/listings`  → `listings` worker
- `shinnslist.com/api/push`      → `push` worker
- `shinnslist.com/api/webhooks/stripe` → `webhooks-stripe` worker
- `shinnslist.com/auth/callback` → `auth-callback` worker

> **Important for auth:** the OAuth `redirect_uri` is derived from `url.origin`, so the
> auth-callback worker must run on the **same origin** as the login page (i.e. behind
> `shinnslist.com`, not `*.workers.dev`) for the PKCE flow to complete. The worker
> reads the `sb-<ref>-auth-token-code-verifier` cookie and writes `sb-<ref>-auth-token`,
> matching `@supabase/ssr` conventions.

Until the custom domain routes are added, you can also point the frontend's API calls
at the `workers.dev` URLs above (the workers respond at both `/` and `/api/<name>`).

## Endpoints & behavior (verified live)

- **checkout** `GET /?tier=pro|pro-flipper[&userId=]` → creates Stripe Checkout
  Session → `302` to Stripe. Returns `500` if `STRIPE_SECRET_KEY` missing.
- **listings** `GET /?lat&lng&radius&limit&tab` → runs `nearby_listings` RPC, returns
  `{ listings }`. Also proxies `/rest/v1/*`, `/rpc/*`, `/auth/v1/*` to Supabase.
  (2026-08-09: fixed coordinate truncation — `parseInt` → `parseFloat` for lat/lng.)
- **push** `POST {action:subscribe|send|unsubscribe}` / `GET` (count). In-memory store
  (ephemeral per-isolate — matches the original edge route).
- **webhooks-stripe** `POST /` → verifies `Stripe-Signature` (HMAC-SHA256, timing-safe),
  syncs `checkout.session.completed` / `customer.subscription.deleted` to Supabase.
- **auth-callback** `GET /?code&next` → PKCE exchange, sets session cookies, redirects.

## Notes
- `compatibility_date` is `2025-09-01` — `2026-08-07` was **not yet supported** by the
  runtime and caused edge error codes 1104/1042. Use a released date.
- Push subscriptions are in-memory. For durable notifications, add KV or a Durable
  Object + Supabase subscription table.
