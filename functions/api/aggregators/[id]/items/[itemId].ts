import { userIdFromRequest, serviceClient } from '../../../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../../../_lib/rate-limit';
import { json, paramId, type PagesContext } from '../../../../_lib/http';
import { readJsonBody } from '../../../../_lib/aggregator-validate';

/**
 * PATCH /api/aggregators/:id/items/:itemId
 * Body: { seen?: boolean, saved?: boolean }
 */
export async function onRequestPatch(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const aggregatorId = paramId(context, 'id');
  const itemId = paramId(context, 'itemId');
  if (!aggregatorId || !itemId) return json({ error: 'missing id' }, 400);

  const rl = rateLimit(request, { limit: 120, windowSeconds: 60, keyPrefix: 'agg-item' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

  const updates: { seen?: boolean; saved?: boolean } = {};
  if (parsed.body.seen !== undefined) {
    if (typeof parsed.body.seen !== 'boolean') {
      return json({ error: 'seen must be a boolean' }, 400);
    }
    updates.seen = parsed.body.seen;
  }
  if (parsed.body.saved !== undefined) {
    if (typeof parsed.body.saved !== 'boolean') {
      return json({ error: 'saved must be a boolean' }, 400);
    }
    updates.saved = parsed.body.saved;
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'provide seen and/or saved' }, 400);
  }

  const sb = serviceClient(env);

  // Ensure the aggregator belongs to the user.
  const { data: aggregator } = await sb
    .from('aggregators')
    .select('id')
    .eq('id', aggregatorId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!aggregator) return json({ error: 'not_found' }, 404);

  const { data, error } = await sb
    .from('aggregator_items')
    .update(updates)
    .eq('id', itemId)
    .eq('aggregator_id', aggregatorId)
    .select('*')
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'not_found' }, 404);

  return json({ item: data });
}
