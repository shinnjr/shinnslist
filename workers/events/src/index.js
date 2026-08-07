export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
    if (request.method !== 'POST' || url.pathname.replace(/\/+$, '''') !== '/batch') {
      return new Response(JSON.stringify({ error: 'POST /batch only' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }
    // minimal body parse
    let body;
    try { body = JSON.parse(await request.text()); } catch (e) { return new Response(JSON.stringify({error:'invalid json'}), {status:400}); }
    return new Response(JSON.stringify({ ok: true, count: body.events?.length || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev' },
    });
  },
};
