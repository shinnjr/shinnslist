import { userIdFromRequest, serviceClient } from '../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';
import { json, type PagesContext } from '../../_lib/http';
import { validateGrantProfile } from '../../_lib/grants';

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const { data, error } = await serviceClient(env).from('grant_profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  return json({ profile: data });
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const rl = rateLimit(request, { limit: 20, windowSeconds: 60, keyPrefix: 'grant-profile' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ error: 'invalid JSON body' }, 400); }
  const validated = validateGrantProfile(raw);
  if (!validated.ok) return json({ error: validated.error }, 400);

  const input = validated.value;
  const completionScore = Math.min(100,
    35 + (input.years_operating ? 8 : 0) + (input.employee_range ? 8 : 0) + (input.revenue_range ? 8 : 0) +
    (input.ownership_identities?.length ? 6 : 0) + (input.mission ? 18 : 0) + (input.funding_use ? 17 : 0)
  );
  const sb = serviceClient(env);
  await sb.from('users').upsert({ id: user.id, email: user.email ?? '' }, { onConflict: 'id', ignoreDuplicates: true });

  const { data, error } = await sb.from('grant_profiles').upsert({
    user_id: user.id,
    ...input,
    completion_score: completionScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('*').single();

  if (error) return json({ error: error.message }, 500);
  return json({ profile: data });
}
