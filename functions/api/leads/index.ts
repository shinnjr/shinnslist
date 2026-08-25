// Lead capture endpoint for the Free Money Finder.
// POST { email, source? } -> upsert into `leads` + record a `trust_events` row.
// Public (no auth): email signup is intentionally open. Rate-limited per IP.
import { serviceClient } from '../../_lib/supabase';
import { json, type PagesContext } from '../../_lib/http';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_SOURCE = 64;

export async function onRequestGet(context: PagesContext): Promise<Response> {
  return json({ ok: true, hint: 'POST { email, source } to subscribe' });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const rl = rateLimit(request, { limit: 5, windowSeconds: 60, keyPrefix: 'leads' });
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  const source = String(body?.source ?? 'free-money').slice(0, MAX_SOURCE);

  if (!EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400);

  const sb = serviceClient(env);

  const { error } = await sb
    .from('leads')
    .upsert({ email, source, status: 'new' }, { onConflict: 'email' });
  if (error) return json({ error: error.message }, 500);

  // WS3 trust/reputation seed: every verified subscriber is a node in the future
  // toll-bridge reputation graph. Fire-and-forget; failure must not fail the signup.
  await sb.from('trust_events').insert({
    actor_type: 'lead',
    actor_id: email,
    event_type: 'lead_created',
    outcome: 'new',
    details: { source },
  });

  return json({ ok: true });
}
