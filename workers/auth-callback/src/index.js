// Shinnslist — Supabase Auth Callback Worker
// Replaces src/app/auth/callback (Next.js route removed during static build).
// GET /?code=...&next=/...  ->  exchange PKCE code for a session, set auth cookies,
//                               redirect to `next` (or /login on failure).
//
// Uses the same cookie conventions as @supabase/ssr so the browser client picks up
// the session automatically:
//   - reads  sb-<ref>-auth-token-code-verifier   (set by the login page)
//   - writes sb-<ref>-auth-token                 (session)

function parseCookies(cookieHeader = '') {
  const out = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

function redirect(location) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export default {
  async fetch(request, env) {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return new Response('Supabase not configured', { status: 500 });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/';
    const origin = url.origin;

    if (!code) {
      return redirect(`${origin}/login?error=auth_failed`);
    }

    const ref = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
    const cookies = parseCookies(request.headers.get('cookie') || '');
    const verifier = cookies[`sb-${ref}-auth-token-code-verifier`];

    if (!verifier) {
      return redirect(`${origin}/login?error=missing_verifier`);
    }

    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('code_verifier', verifier);
    params.set('redirect_uri', `${origin}/auth/callback`);

    let data;
    try {
      const resp = await fetch(`${supabaseUrl}/auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: params.toString(),
      });
      data = await resp.json();
      if (!resp.ok || !data.access_token) {
        console.error('[Auth callback] token exchange failed', data);
        return redirect(`${origin}/login?error=auth_failed`);
      }
    } catch (e) {
      console.error('[Auth callback] error', e);
      return redirect(`${origin}/login?error=auth_failed`);
    }

    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
    const sessionValue = encodeURIComponent(
      JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in || 3600,
        expires_at: expiresAt,
        refresh_token: data.refresh_token,
        user: data.user,
      })
    );

    const response = redirect(`${origin}${next}`);
    response.headers.append(
      'Set-Cookie',
      `sb-${ref}-auth-token=${sessionValue}; Path=/; HttpOnly; Max-Age=${data.expires_in || 3600}; SameSite=Lax`
    );
    // Clear the PKCE verifier cookie.
    response.headers.append('Set-Cookie', `sb-${ref}-auth-token-code-verifier=; Path=/; Max-Age=0`);
    return response;
  },
};
