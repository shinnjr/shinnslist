import { NextResponse, type NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'edge';

/**
 * Open the Stripe Customer Portal so a signed-in user can manage
 * or cancel their subscription, update payment method, etc.
 */
export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized', url: '/login' }, { status: 401 });
  }

  const { data: row } = await createServiceClient()
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!row?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription to manage.', url: '/pricing' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shinnslist.pages.dev';
  const session = await getStripe().billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
