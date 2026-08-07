export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

// In-memory subscription store (use Supabase in production)
const subscriptions: PushSubscriptionJSON[] = [];

let webpush: any = null;
async function getWebPush() {
  if (!webpush) {
    const wp = await import('web-push');
    const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BG80yZAIdz0maw1UoiUebr8ErFrpj8DTxaLMdEjgdgi45hEzT8y6ISnkpt-H-ClLr1OyvzAT54DRi7y6Nq1HnS0';
    const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'FV6lvqR2tkl9yu55yAVH2MCGTcGZe-RjHSQC_zJ2OcY';
    wp.setVapidDetails(
      'https://shinnslist.com',
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );
    webpush = wp;
  }
  return webpush;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subscription } = body;

    if (action === 'subscribe') {
      const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
      if (!exists) {
        subscriptions.push(subscription);
      }
      return NextResponse.json({ success: true, count: subscriptions.length });

    } else if (action === 'send') {
      const wp = await getWebPush();
      const { title, body: notifBody, url } = body;
      const payload = JSON.stringify({
        title: title || '🔥 New Deal!',
        body: notifBody || 'A new deal just dropped.',
        url: url || '/',
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          wp.sendNotification(sub as any, payload).catch((err: any) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              const idx = subscriptions.indexOf(sub);
              if (idx > -1) subscriptions.splice(idx, 1);
            }
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      return NextResponse.json({ success: true, sent: succeeded, total: subscriptions.length });

    } else if (action === 'unsubscribe') {
      const idx = subscriptions.findIndex(s => s.endpoint === subscription?.endpoint);
      if (idx > -1) subscriptions.splice(idx, 1);
      return NextResponse.json({ success: true, count: subscriptions.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Push API]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ subscribers: subscriptions.length });
}
