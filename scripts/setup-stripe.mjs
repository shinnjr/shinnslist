// ============================================================
// Shinnslist — Stripe product/price provisioning script
// Creates all 9 products + weekly recurring prices in the Stripe
// account referenced by STRIPE_SECRET_KEY (switch the dashboard
// to Test mode first). Idempotent: re-running reuses existing
// prices by lookup_key and never duplicates.
//
// Usage:  node scripts/setup-stripe.mjs
// Prints the price IDs + .env lines you should add to .env.local
// and to the Cloudflare Pages environment variables.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';

// Load .env.local manually (no dotenv dependency).
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv(path.join(process.cwd(), '.env.local'));
const key = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!key || !key.startsWith('sk_test_')) {
  console.error(
    '✖ No test-mode Stripe key found. Put STRIPE_SECRET_KEY=sk_test_... in .env.local\n' +
      '  (make sure the Stripe dashboard is switched to Test mode), then re-run.'
  );
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });

// Canonical catalog (kept in sync with src/lib/pricing.ts).
const CATALOG = [
  { lookupKey: 'pro-weekly',          name: 'Shinnslist Pro',           amount: 500, kind: 'tier' },
  { lookupKey: 'pro-flipper-weekly',  name: 'Pro Flipper',              amount: 2000, kind: 'tier' },
  { lookupKey: 'addon-instant',       name: 'Instant Alerts',           amount: 300, kind: 'addon' },
  { lookupKey: 'addon-state',         name: 'Additional State',         amount: 100, kind: 'addon' },
  { lookupKey: 'addon-research',      name: 'Research & Comps',         amount: 400, kind: 'addon' },
  { lookupKey: 'addon-export',        name: 'Data Export',              amount: 500, kind: 'addon' },
  { lookupKey: 'addon-digest',        name: 'Email Digest',             amount: 200, kind: 'addon' },
  { lookupKey: 'addon-country',       name: 'Whole Country',            amount: 800, kind: 'addon' },
  { lookupKey: 'addon-roadtrip',      name: 'Road Trip',                amount: 300, kind: 'addon' },
];

function envVarFor(lookupKey) {
  const map = {
    'pro-weekly': 'STRIPE_PRO_PRICE_ID',
    'pro-flipper-weekly': 'STRIPE_FLIPPER_PRICE_ID',
    'addon-instant': 'STRIPE_ADDON_INSTANT_PRICE_ID',
    'addon-state': 'STRIPE_ADDON_STATE_PRICE_ID',
    'addon-research': 'STRIPE_ADDON_RESEARCH_PRICE_ID',
    'addon-export': 'STRIPE_ADDON_EXPORT_PRICE_ID',
    'addon-digest': 'STRIPE_ADDON_DIGEST_PRICE_ID',
    'addon-country': 'STRIPE_ADDON_COUNTRY_PRICE_ID',
    'addon-roadtrip': 'STRIPE_ADDON_ROADTRIP_PRICE_ID',
  };
  return map[lookupKey];
}

async function ensurePrice(item) {
  const existing = await stripe.prices.list({ lookup_keys: [item.lookupKey], limit: 1 });
  if (existing.data.length) {
    const p = existing.data[0];
    return { price: p, created: false };
  }
  // Create product, then a recurring weekly price with a lookup_key.
  const product = await stripe.products.create({
    name: item.name,
    metadata: { lookup_key: item.lookupKey, kind: item.kind },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: item.amount,
    currency: 'usd',
    recurring: { interval: 'week' },
    lookup_key: item.lookupKey,
  });
  return { price, created: true };
}

console.log('Provisioning Stripe products/prices (test mode)…\n');

const results = [];
for (const item of CATALOG) {
  try {
    const { price, created } = await ensurePrice(item);
    results.push({ item, price, created });
    console.log(
      `${created ? '✓ created' : '· reused '} ${item.lookupKey.padEnd(22)} $${(item.amount / 100).toFixed(2)}/wk  ${price.id}`
    );
  } catch (err) {
    console.error(`✖ ${item.lookupKey}:`, err.message);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log('\nAdd these to .env.local and the Cloudflare Pages env vars:\n');
  for (const { item, price } of results) {
    console.log(`${envVarFor(item.lookupKey)}=${price.id}`);
  }
  console.log('\nStripe secret (test): STRIPE_SECRET_KEY=sk_test_...');
  console.log('Webhook secret:       STRIPE_WEBHOOK_SECRET=whsec_... (see webhook setup below)');
  console.log('\nThen register a webhook endpoint in the Stripe dashboard → Webhooks:');
  console.log('  URL:    https://shinnslist.pages.dev/api/webhooks/stripe');
  console.log('  Events: checkout.session.completed, customer.subscription.updated,');
  console.log('          customer.subscription.deleted, invoice.payment_failed');
}
