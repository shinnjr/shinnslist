import { userIdFromRequest, serviceClient } from '../../../_lib/supabase';
import { json, paramId, type PagesContext } from '../../../_lib/http';

/**
 * GET /api/aggregators/:id/items
 * Query: limit (default 50, max 100), offset, filter=all|new|saved
 */
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const id = paramId(context);
  if (!id) return json({ error: 'missing id' }, 400);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get('limit') || 50);
  const offsetRaw = Number(url.searchParams.get('offset') || 0);
  const filter = (url.searchParams.get('filter') || 'all').toLowerCase();

  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50));
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0);

  if (!['all', 'new', 'saved'].includes(filter)) {
    return json({ error: 'filter must be all|new|saved' }, 400);
  }

  const sb = serviceClient(env);
  const { data: aggregator } = await sb
    .from('aggregators')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!aggregator) return json({ error: 'not_found' }, 404);

  let query = sb
    .from('aggregator_items')
    .select(
      `
      id,
      aggregator_id,
      listing_id,
      deal_score,
      matched_reason,
      seen,
      saved,
      created_at,
      listings (
        id,
        title,
        description,
        photos,
        price,
        estimated_value,
        category,
        source,
        source_url,
        city,
        state,
        posted_at,
        flags,
        condition
      )
    `,
      { count: 'exact' }
    )
    .eq('aggregator_id', id)
    .order('deal_score', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'new') query = query.eq('seen', false);
  if (filter === 'saved') query = query.eq('saved', true);

  const { data, error, count } = await query;
  if (error) return json({ error: error.message }, 500);

  const items = (data || []).map((row) => {
    const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;
    return {
      id: row.id,
      aggregator_id: row.aggregator_id,
      listing_id: row.listing_id,
      deal_score: row.deal_score,
      matched_reason: row.matched_reason,
      seen: row.seen,
      saved: row.saved,
      created_at: row.created_at,
      listing: listing || null,
    };
  });

  return json({
    items,
    total: count ?? items.length,
    aggregator,
  });
}
