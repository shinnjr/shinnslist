import { serviceClient } from '../../../_lib/supabase';
import { json, type PagesContext } from '../../../_lib/http';

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const slug = new URL(request.url).pathname.split('/').pop() || '';
  if (!slug) return json({ error: 'slug required' }, 400);

  const { data, error } = await serviceClient(env)
    .from('grant_opportunities')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'grant not found' }, 404);
  return json({ grant: data });
}
