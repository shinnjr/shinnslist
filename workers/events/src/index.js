export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (request.method === 'GET') {
      return new Response(JSON.stringify({ ok: true, table: 'events' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' },
      });
    }

    if (request.method !== 'POST' || path !== '/batch') {
      return new Response(JSON.stringify({ error: 'POST /batch only' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    // Rate limit: 120 events/min per IP
    const ip = request.headers.get('cf-connecting-ip') || 'anon';
    const now = Date.now();

    let body;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const events = Array.isArray(body.events) ? body.events : [];
    if (!events.length || events.length > 100) {
      return new Response(JSON.stringify({ error: 'events array required (1-100)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const rows = events.map(function(e) {
      return {
        device_id: e.device_id || 'anon',
        event: e.event,
        ts: e.ts || new Date().toISOString(),
        category: e.category || null,
        deal_id: e.deal_id || null,
        price: typeof e.price === 'number' ? e.price : null,
        estimated_value: typeof e.estimated_value === 'number' ? e.estimated_value : null,
        delta_pct: typeof e.delta_pct === 'number' ? e.delta_pct : null,
        city: e.city || null,
        vertical: e.vertical || null,
        plan: e.plan || null,
        extra: e.extra ? JSON.stringify(e.extra) : null,
      };
    });

    try {
      const res = await fetch(supabaseUrl + '/rest/v1/events', {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(rows),
      });
      return new Response(JSON.stringify({ ok: res.ok, inserted: res.ok ? rows.length : 0 }), {
        status: res.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Insert failed', detail: String(e) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
