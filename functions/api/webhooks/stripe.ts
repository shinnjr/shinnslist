import type Stripe from 'stripe';
import { getStripe } from '../../_lib/stripe';
import { applySubscriptionToUser, getUserByStripeCustomer } from '../../_lib/billing';
import { addonForLookupKey, tierForLookupKey } from '../../_lib/config';

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

/**
 * Stripe webhook. Verifies the signature, then keeps the Supabase users
 * row in sync with the subscription lifecycle:
 *   checkout.session.completed  → activate tier + add-ons
 *   customer.subscription.updated → sync status
 *   customer.subscription.deleted → downgrade to free
 *   invoice.payment_failed       → mark past_due
 */
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  const secret = (env.STRIPE_WEBHOOK_SECRET as string) || '';

  if (!signature || !secret) {
    return json({ error: 'Missing signature or webhook secret' }, 400);
  }

  let event: Stripe.Event;
  try {
    event = getStripe(env).webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return json({ error: `Webhook signature verification failed: ${message}` }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckout(env, event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(env, event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(env, event.data.object);
        break;
      case 'invoice.payment_failed':
        break; // status sync happens on subscription.updated
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook] handler error:', message);
    return json({ error: message }, 500); // 500 → Stripe retries
  }

  return json({ received: true });
}

async function handleCheckout(env: Record<string, unknown>, session: any): Promise<void> {
  if (!session.metadata?.user_id) return;
  const userId = session.metadata.user_id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  // Read each line item's price lookup_key to derive tier + add-ons.
  const full = await getStripe(env).checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price'],
  });
  const keys = (full.line_items?.data ?? [])
    .map((li: any) => li.price?.lookup_key)
    .filter(Boolean);

  const tierKey = keys.find((k: string) => tierForLookupKey(k));
  const tier = (tierKey ? tierForLookupKey(tierKey) : 'pro') as 'pro' | 'flipper';
  const addons = keys.map(addonForLookupKey).filter((a): a is string => Boolean(a));

  await applySubscriptionToUser(env, userId, {
    tier,
    addons,
    status: 'active',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

async function handleSubscriptionUpdated(env: Record<string, unknown>, sub: any): Promise<void> {
  const userId = await resolveUserId(env, sub);
  if (!userId) return;
  const status = mapStatus(sub.status);
  const tier = sub.metadata?.tier === 'flipper' ? 'flipper' : 'pro';
  const addons = sub.metadata?.addons ? JSON.parse(sub.metadata.addons) : [];
  await applySubscriptionToUser(env, userId, {
    tier,
    addons,
    status,
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: sub.id,
  });
}

async function handleSubscriptionDeleted(env: Record<string, unknown>, sub: any): Promise<void> {
  const userId = await resolveUserId(env, sub);
  if (!userId) return;
  await applySubscriptionToUser(env, userId, {
    tier: 'free',
    addons: [],
    status: 'canceled',
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
  });
}

function mapStatus(status: string): 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'none' {
  switch (status) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due': return 'past_due';
    case 'unpaid': return 'unpaid';
    case 'canceled': return 'canceled';
    default: return 'none';
  }
}

async function resolveUserId(env: Record<string, unknown>, sub: any): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const user = await getUserByStripeCustomer(env, customerId);
  return user?.id ?? null;
}
