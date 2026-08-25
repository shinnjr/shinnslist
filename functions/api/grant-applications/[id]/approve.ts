import { userIdFromRequest, serviceClient } from '../../../_lib/supabase';
import { rateLimit, rateLimitedResponse } from '../../../_lib/rate-limit';
import { json, paramId, type PagesContext } from '../../../_lib/http';

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const rl = rateLimit(request, { limit: 10, windowSeconds: 60, keyPrefix: 'grant-approve' });
  if (!rl.ok) return rateLimitedResponse(rl);

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized' }, 401);
  const id = paramId(context);
  if (!id) return json({ error: 'application id is required' }, 400);

  const sb = serviceClient(env);
  const { data: application, error } = await sb.from('grant_applications').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!application) return json({ error: 'application not found' }, 404);
  if (application.status !== 'draft_ready') return json({ error: `application is ${application.status}, not draft_ready` }, 409);
  if ((application.blockers || []).length || (application.missing_fields || []).length) return json({ error: 'resolve blockers and missing fields before approval' }, 409);

  const approvedAt = new Date().toISOString();
  const { data: approved, error: updateError } = await sb.from('grant_applications').update({ status: 'approved', approved_at: approvedAt, updated_at: approvedAt }).eq('id', id).eq('user_id', user.id).select('*').single();
  if (updateError) return json({ error: updateError.message }, 500);

  const { error: jobError } = await sb.from('grant_submission_jobs').upsert({ application_id: id, user_id: user.id, status: 'queued', next_attempt_at: approvedAt, updated_at: approvedAt }, { onConflict: 'application_id' });
  if (jobError) {
    await sb.from('grant_applications').update({ status: 'draft_ready', approved_at: null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    return json({ error: 'could not queue inspection' }, 500);
  }

  await sb.from('grant_application_events').insert({ application_id: id, user_id: user.id, event_type: 'inspection_approved', actor: 'user', details: { approved_at: approvedAt, scope: 'public_form_inspection_only' } });
  return json({ application: approved, inspection: { status: 'queued' }, submission_authorized: false });
}
