export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (userId) {
          await supabase.from('users').upsert({
            id: userId,
            subscription: session.metadata?.tier || 'pro',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await supabase.from('users').update({
            subscription: 'free',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        console.log('[Webhook] Payment failed for invoice', event.data.object.id);
        break;
      }
    }
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
