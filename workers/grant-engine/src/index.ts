// Shinnslist Grant Engine — perpetual, primary-source grant discovery.
// Every 6 hours (Cloudflare cron) it pulls open opportunities from authoritative
// feeds, normalizes them into the canonical schema, rejects scams/fees/duplicates,
// and upserts into Supabase. No competitor crawling — only primary sources.
import type { EngineEnv, GrantRecord, IngestSummary } from './types';
import { fetchGrantsGov, normalizeGrantsGov } from './sources/grantsgov';
import { passesVerification } from './verify';
import { fetchExistingSlugs, upsertGrants } from './supabase';

type ScheduledController = { cron: string; scheduledTime: number };
type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

export default {
  async scheduled(_controller: ScheduledController, env: EngineEnv, _ctx: ExecutionContext): Promise<void> {
    await runIngest(env);
  },

  async fetch(request: Request, env: EngineEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'shinnslist-grant-engine',
        supabase: env.SUPABASE_URL ? 'configured' : 'missing',
        grants_gov_key: env.GRANTS_GOV_API_KEY ? 'set' : 'missing',
      });
    }
    if (url.pathname === '/ingest' && request.method === 'POST') {
      const summary = await runIngest(env);
      return json(summary, summary.error ? 500 : 200);
    }
    return json({ ok: true, endpoints: ['/health', '/ingest (POST)'] });
  },
};

async function runIngest(env: EngineEnv): Promise<IngestSummary> {
  const connectors: IngestSummary['connectors'] = [];
  const all: GrantRecord[] = [];

  // Connector 1 — Grants.gov (federal)
  const gg = await fetchGrantsGov(env);
  const ggGrants = normalizeGrantsGov(gg.raw);
  connectors.push({ source: 'grants.gov', found: ggGrants.length, accepted: 0, note: gg.note });
  all.push(...ggGrants);

  // Verify + dedupe (scam signals, application fees, duplicates)
  const existing = await fetchExistingSlugs(env);
  const accepted: GrantRecord[] = [];
  for (const g of all) {
    if (existing.has(g.slug)) continue;
    if (!passesVerification(g).ok) continue;
    accepted.push(g);
  }
  connectors[0].accepted = accepted.length;

  let upserted = 0;
  try {
    upserted = await upsertGrants(env, accepted);
  } catch (e) {
    return { connectors, totalAccepted: accepted.length, upserted: 0, error: String(e) };
  }

  return { connectors, totalAccepted: accepted.length, upserted };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
