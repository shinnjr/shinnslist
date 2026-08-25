import { userIdFromRequest, serviceClient } from '../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';
import { json, type PagesContext } from '../../_lib/http';
import { readJsonBody, validateAggregatorInput } from '../../_lib/aggregator-validate';

/**
 * GET  /api/aggregators — list the signed-in user's watches + unseen item counts
 * POST /api/aggregators — create a new watch
 */
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const sb = serviceClient(env);

  const { data: aggregators, error } = await sb
    .from('aggregators')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);

  const rows = aggregators || [];
  const ids = rows.map((a) => a.id as string);

  const itemCounts: Record<string, number> = {};
  for (const id of ids) itemCounts[id] = 0;

  if (ids.length > 0) {
    // Count unseen items per aggregator (fresh finds).
    const { data: unseen } = await sb
      .from('aggregator_items')
      .select('aggregator_id')
      .in('aggregator_id', ids)
      .eq('seen', false);

    for (const item of unseen || []) {
      const aid = item.aggregator_id as string;
      itemCounts[aid] = (itemCounts[aid] || 0) + 1;
    }
  }

  const result = rows.map((a) => ({
    ...a,
    item_counts: { unseen: itemCounts[a.id as string] || 0 },
  }));

  return json({ aggregators: result });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const rl = rateLimit(request, { limit: 30, windowSeconds: 60, keyPrefix: 'agg-create' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

  const validated = validateAggregatorInput(parsed.body, { requireName: true });
  if (!validated.ok) return json({ error: validated.error }, 400);

  const input = validated.value;
  const sb = serviceClient(env);

  // Ensure the user has a `users` row (some accounts never finished onboarding).
  await sb.from('users').upsert(
    { id: user.id, email: user.email ?? '' },
    { onConflict: 'id', ignoreDuplicates: true }
  );

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
    .insert({
      user_id: user.id,
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
    })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ aggregator: data }, 201);
}
