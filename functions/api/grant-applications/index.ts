import { userIdFromRequest, serviceClient } from '../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';
import { json, type PagesContext } from '../../_lib/http';
import { draftFromProfile, scoreGrant } from '../../_lib/grants';

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);

  const { data, error } = await serviceClient(env)
    .from('grant_applications')
    .select('*,grant:grant_opportunities(slug,name,funder,amount_label,deadline_label,status,source_url,verified_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);
  return json({ applications: data || [] });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const rl = rateLimit(request, { limit: 15, windowSeconds: 60, keyPrefix: 'grant-app-create' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return json({ error: 'invalid JSON body' }, 400); }
  const grantSlug = typeof body.grant_slug === 'string' ? body.grant_slug.trim() : '';
  if (!grantSlug || grantSlug.length > 180) return json({ error: 'grant_slug is required' }, 400);

  const sb = serviceClient(env);
  const [{ data: profile, error: profileError }, { data: grant, error: grantError }] = await Promise.all([
    sb.from('grant_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    sb.from('grant_opportunities').select('*').eq('slug', grantSlug).in('status', ['open', 'rolling', 'upcoming']).maybeSingle(),
  ]);
  if (profileError) return json({ error: profileError.message }, 500);
  if (!profile) return json({ error: 'complete grant profile first' }, 409);
  if (grantError) return json({ error: grantError.message }, 500);
  if (!grant) return json({ error: 'grant not found or no longer active' }, 404);

  const match = scoreGrant(profile, grant);
  const draft = draftFromProfile(profile, grant);
  const status = match.status === 'ineligible' ? 'blocked' : draft.missing.length ? 'needs_info' : 'draft_ready';

  const { data, error } = await sb.from('grant_applications').upsert({
    user_id: user.id,
    grant_id: grant.id,
    cycle_key: grant.cycle_key,
    status,
    eligibility_status: match.status,
    match_score: match.score,
    match_reasons: match.reasons,
    blockers: match.blockers,
    draft_answers: draft.answers,
    missing_fields: draft.missing,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,grant_id,cycle_key' }).select('*').single();

  if (error) return json({ error: error.message }, 500);
  await sb.from('grant_application_events').insert({
    application_id: data.id,
    user_id: user.id,
    event_type: 'draft_created',
    actor: 'system',
    details: {
      status,
      match_score: match.score,
      answer_provenance: {
        applicant_name: ['grant_profile.public_name', 'grant_profile.legal_name'],
        applicant_summary: ['grant_profile.mission'],
        use_of_funds: ['grant_profile.funding_use'],
        eligibility_summary: ['grant_profile.legal_name', 'grant_profile.city', 'grant_profile.state', 'grant_profile.applicant_type'],
        funder_alignment: ['grant_profile.mission', 'grant_opportunity.funder', 'program_specific_template'],
      },
    },
  });
  return json({ application: data, submission_authorized: false }, 201);
}
