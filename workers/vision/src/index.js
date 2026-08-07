// Shinnslist — Deal Vision Worker
// POST /analyze  { image: <base64 jpeg/png>, priceTag?: number }
//   → identifies the item via vision LLM, estimates fair market value,
//     returns { item, retailValue, condition, confidence, category, notes }
// The VALUATION ENGINE is the product — this worker is its guarded server-side face.
// Never expose scoring internals client-side.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
};

const RATE_LIMIT = { windowMs: 60000, max: 20 }; // 20 scans/min/IP
const hits = new Map(); // ip -> { count, resetAt }

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT.max;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured' }, 500);

    const url = new URL(request.url);
    if (url.pathname.replace(/\/+$/, '') !== '/analyze') {
      return json({ error: 'Not found' }, 404);
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (rateLimited(ip)) {
      return json({ error: 'Too many scans — try again in a minute' }, 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    if (!image || image.length < 100) return json({ error: 'Missing image data' }, 400);
    // accept either a bare base64 blob or a data URI
    const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const priceTag = typeof body.priceTag === 'number' && body.priceTag >= 0 ? body.priceTag : null;

    const prompt =
      'You are the valuation engine of a deal-finding app. Look at this photo of a single used item. ' +
      'Respond with STRICT JSON, no markdown, no extra text: ' +
      '{"item":"precise name incl. brand and model","condition":"new|like-new|good|fair|poor","retailValue":<number, best-estimate fair market resale value USD>, ' +
      '"category":"one of: free-stuff|trading-cards|sneakers|watches|legos|handbags|electronics|cars|real-estate|furniture|other", ' +
      '"confidence":"high|medium|low","notes":"one short line on why, incl. obvious defects, missing parts, or brand risk"}.' +
      (priceTag !== null
        ? ` The seller's asking price tag reads $${priceTag}. Include a "deltaPct": <0..1 fraction the ask is below retail> and "verdict":"deal|meh|skip" in the JSON.`
        : '');

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return json({ error: 'Vision engine failed', detail: data.error?.message }, 502);
      }
      const text = data.choices?.[0]?.message?.content || '{}';
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { item: 'Unknown item', retailValue: null, confidence: 'low', notes: text.slice(0, 200) };
      }
      return json({ ok: true, ...parsed });
    } catch (e) {
      return json({ error: 'Internal error', detail: String(e) }, 500);
    }
  },
};
