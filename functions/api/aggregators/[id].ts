import { userIdFromRequest, serviceClient } from '../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';
import { json, paramId, type PagesContext } from '../../_lib/http';
import { readJsonBody, validateAggregatorInput } from '../../_lib/aggregator-validate';

/**
 * PATCH  /api/aggregators/:id — update own aggregator
 * DELETE /api/aggregators/:id — delete own aggregator (cascade items)
 */
export async function onRequestPatch(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const id = paramId(context);
  if (!id) return json({ error: 'missing id' }, 400);

  const rl = rateLimit(request, { limit: 40, windowSeconds: 60, keyPrefix: 'agg-patch' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const sb = serviceClient(env);
  const { data: existing } = await sb
    .from('aggregators')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) return json({ error: 'not_found' }, 404);

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

  // Merge with existing so partial patches validate as a full candidate.
  const merged: Record<string, unknown> = {
    name: existing.name,
    emoji: existing.emoji,
    keywords: existing.keywords,
    categories: existing.categories,
    sources: existing.sources,
    min_price: existing.min_price,
    max_price: existing.max_price,
    min_deal_score: existing.min_deal_score,
    zone_id: existing.zone_id,
    active: existing.active,
    ...parsed.body,
  };

  const validated = validateAggregatorInput(merged, { requireName: true });
  if (!validated.ok) return json({ error: validated.error }, 400);

  const input = validated.value;

  if (input.zone_id) {
    const { data: zone } = await sb
      .from('zones')
      .select('id')
      .eq('id', input.zone_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!zone) return json({ error: 'zone_id not found or not owned' }, 400);
  }

  const { data, error } = await sb
    .from('aggregators')
    .update({
      name: input.name,
      emoji: input.emoji,
      keywords: input.keywords,
      categories: input.categories,
      sources: input.sources,
      min_price: input.min_price,
      max_price: input.max_price,
      min_deal_score: input.min_deal_score,
      zone_id: input.zone_id,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ aggregator: data });
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const id = paramId(context);
  if (!id) return json({ error: 'missing id' }, 400);

  const rl = rateLimit(request, { limit: 20, windowSeconds: 60, keyPrefix: 'agg-delete' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const sb = serviceClient(env);
  const { data: existing } = await sb
    .from('aggregators')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) return json({ error: 'not_found' }, 404);

  const { error } = await sb
    .from('aggregators')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
