import { getStripe } from '../../_lib/stripe';
import { userIdFromRequest, serviceClient } from '../../_lib/supabase';
import { appUrl } from '../../_lib/config';

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Open the Stripe Customer Portal so a user can manage/cancel their subscription. */
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ error: 'unauthorized', url: '/login' }, 401);

  const { data: row } = await serviceClient(env)
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!row?.stripe_customer_id) {
    return json({ error: 'No active subscription to manage.', url: '/pricing' }, 400);
  }

  const session = await getStripe(env).billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${appUrl(env)}/pricing`,
  });

  return json({ url: session.url });
}
