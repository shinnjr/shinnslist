import { userIdFromRequest, serviceClient } from '../../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../../_lib/rate-limit';
import { json, paramId, type PagesContext } from '../../../_lib/http';
import { runAggregator } from '../../../_lib/aggregators';

/**
 * POST /api/aggregators/:id/run — compile matches for own aggregator
 */
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const id = paramId(context);
  if (!id) return json({ error: 'missing id' }, 400);

  const rl = rateLimit(request, { limit: 15, windowSeconds: 60, keyPrefix: 'agg-run' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const sb = serviceClient(env);
  const { data: existing } = await sb
    .from('aggregators')
    .select('id, last_run_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) return json({ error: 'not_found' }, 404);

  try {
    const result = await runAggregator(sb, id);
    const { data: updated } = await sb
      .from('aggregators')
      .select('last_run_at')
      .eq('id', id)
      .maybeSingle();

    return json({
      inserted: result.inserted,
      total: result.total,
      last_run_at: updated?.last_run_at ?? new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'run_failed';
    return json({ error: message }, 500);
  }
}
