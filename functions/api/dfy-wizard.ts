// DFY wizard progress — powers the "started but didn't finish" ping.
// The /file/[slug] and grant flows POST each step here when an email
// is present. Rows with done=false and no order are candidates for a
// single, friendly "we'll finish it for you" email (24h later, once).
import { serviceClient } from '../_lib/supabase';
import { json, type PagesContext } from '../_lib/http';
import { rateLimit, rateLimitedResponse } from '../_lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KINDS = new Set(['class-action', 'grant']);

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: 'invalid email' }, 400);

  const sb = serviceClient(env);
  const { data, error } = await sb
    .from('dfy_wizard_progress')
    .select('kind, slug, step, total_steps, done, declined, updated_at')
    .eq('email', email)
    .order('updated_at', { ascending: false });
  if (error) return json({ error: error.message }, 500);
  return json({ progress: data || [] });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const rl = rateLimit(request, { limit: 20, windowSeconds: 60, keyPrefix: 'dfy-wizard' });
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: 'email required to save progress' }, 400);

  const kind = String(body?.kind ?? '');
  if (!KINDS.has(kind)) return json({ error: 'invalid kind' }, 400);

  const slug = String(body?.slug ?? '').slice(0, 180);
  if (!slug) return json({ error: 'slug required' }, 400);

  const step = Math.min(20, Math.max(1, Number.isFinite(body.step) ? Math.round(body.step as number) : 1));
  const total = Math.min(20, Math.max(1, Number.isFinite(body.total_steps) ? Math.round(body.total_steps as number) : 4));
  const done = body.done === true;
  const declined = body.declined === true;

  const sb = serviceClient(env);
  // Fetch-then-upsert so "done" is sticky (a later stray POST can't un-done it).
  const { data: existing } = await sb
    .from('dfy_wizard_progress')
    .select('done, declined')
    .eq('email', email)
    .eq('kind', kind)
    .eq('slug', slug)
    .maybeSingle();

  const { error } = await sb.from('dfy_wizard_progress').upsert(
    {
      email,
      kind,
      slug,
      step,
      total_steps: total,
      done: done || Boolean(existing?.done),
      declined: declined || Boolean(existing?.declined),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email,kind,slug' }
  );
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
}
