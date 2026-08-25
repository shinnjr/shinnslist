interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  KITESURF_API_TOKEN: string;
  ADMIN_API_SECRET: string;
}

type ScheduledController = {
  cron: string;
  scheduledTime: number;
};

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
};

type Grant = {
  slug: string;
  name: string;
  source_url: string;
  application_url: string | null;
};

type Application = {
  id: string;
  user_id: string;
  status: string;
  grant: Grant;
};

type SubmissionJob = {
  id: string;
  status: string;
  attempt_count: number;
  application: Application;
};

type Inspection = {
  url: string;
  browser: 'kitesurf' | 'chromium_fallback';
  browserMs: number | null;
  pageBytes: number;
  formCount: number;
  inputCount: number;
  hasLogin: boolean;
  hasCaptcha: boolean;
  hasFileUpload: boolean;
  hasSignatureLanguage: boolean;
  discoveredAt: string;
};

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isAuthorized(request: Request, env: Env): boolean {
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${env.ADMIN_API_SECRET}`;
}

function assertPublicUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only http(s) URLs are allowed');
  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host === '0.0.0.0' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) throw new Error('Private-network URLs are not allowed');
  return url;
}

async function supabaseRequest(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
}

async function updateJob(env: Env, id: string, patch: Record<string, unknown>): Promise<void> {
  const response = await supabaseRequest(env, `grant_submission_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Job update failed (${response.status})`);
}

async function updateApplication(env: Env, id: string, patch: Record<string, unknown>): Promise<void> {
  const response = await supabaseRequest(env, `grant_applications?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Application update failed (${response.status})`);
}

async function addEvent(env: Env, applicationId: string, userId: string, eventType: string, details: Record<string, unknown>): Promise<void> {
  const response = await supabaseRequest(env, 'grant_application_events', {
    method: 'POST',
    body: JSON.stringify({ application_id: applicationId, user_id: userId, event_type: eventType, actor: 'browser_worker', details }),
  });
  if (!response.ok) throw new Error(`Event insert failed (${response.status})`);
}

async function inspectWithKitesurf(env: Env, rawUrl: string): Promise<Inspection> {
  const url = assertPublicUrl(rawUrl);
  const baseEndpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-run/content`;
  const payload = JSON.stringify({ url: url.toString() });
  const request = (endpoint: string) => fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.KITESURF_API_TOKEN}`,
      'content-type': 'application/json',
    },
    body: payload,
  });

  let browser: Inspection['browser'] = 'kitesurf';
  let response = await request(`${baseEndpoint}?browser=kitesurf`);
  if (!response.ok && response.status >= 500) {
    browser = 'chromium_fallback';
    response = await request(baseEndpoint);
  }

  const browserMsHeader = response.headers.get('x-browser-ms-used');
  const browserMs = browserMsHeader ? Number(browserMsHeader) : null;
  const raw = await response.text();
  if (!response.ok) throw new Error(`Browser inspection failed (${response.status}, ${browser}): ${raw.slice(0, 180)}`);

  let html = raw;
  try {
    const parsed = JSON.parse(raw) as { result?: string };
    if (typeof parsed.result === 'string') html = parsed.result;
  } catch {
    // Browser Run may return content directly; inspect the raw body in that case.
  }

  const lower = html.toLowerCase();
  return {
    url: url.toString(),
    browser,
    browserMs: Number.isFinite(browserMs) ? browserMs : null,
    pageBytes: new TextEncoder().encode(html).byteLength,
    formCount: (lower.match(/<form\b/g) || []).length,
    inputCount: (lower.match(/<(input|textarea|select)\b/g) || []).length,
    hasLogin: /sign in|log in|login|create account|register/.test(lower),
    hasCaptcha: /captcha|hcaptcha|recaptcha|turnstile/.test(lower),
    hasFileUpload: /type=["']file["']|upload (a )?(file|document)/.test(lower),
    hasSignatureLanguage: /signature|certif(y|ication)|attest|under penalty/.test(lower),
    discoveredAt: new Date().toISOString(),
  };
}

function classifyInspection(inspection: Inspection): { reason: string; gate: string } {
  if (inspection.hasLogin) {
    return { gate: 'authenticated_session', reason: 'The grant portal requires an authenticated applicant session.' };
  }
  if (inspection.hasCaptcha) {
    return { gate: 'anti_bot_check', reason: 'The application presents a CAPTCHA or anti-bot verification.' };
  }
  if (inspection.hasSignatureLanguage) {
    return { gate: 'legal_attestation', reason: 'A signature, certification, or legal attestation requires applicant approval.' };
  }
  if (inspection.formCount === 0 || inspection.inputCount === 0) {
    return { gate: 'form_not_found', reason: 'No public application form was found on the verified source page.' };
  }
  return { gate: 'adapter_required', reason: 'The public form was found. A source-specific field adapter must pass validation before external submission.' };
}

async function processJob(env: Env, job: SubmissionJob): Promise<Record<string, unknown>> {
  const now = new Date().toISOString();
  if (!job.application || job.application.status !== 'approved') {
    await updateJob(env, job.id, { status: 'failed', last_error: 'Application is not in approved state.', updated_at: now });
    return { id: job.id, status: 'failed', reason: 'not_approved' };
  }

  await updateJob(env, job.id, {
    status: 'running',
    locked_at: now,
    locked_by: 'shinnslist-grant-runner',
    attempt_count: (job.attempt_count || 0) + 1,
    last_error: null,
    updated_at: now,
  });

  try {
    const targetUrl = job.application.grant.application_url || job.application.grant.source_url;
    const inspection = await inspectWithKitesurf(env, targetUrl);
    const classification = classifyInspection(inspection);
    const completedAt = new Date().toISOString();
    await updateJob(env, job.id, {
      status: 'human_gate',
      browser_receipt: inspection,
      human_gate: {
        type: classification.gate,
        reason: classification.reason,
        scope: 'inspection_only',
        submission_authorized: false,
      },
      locked_at: null,
      locked_by: null,
      updated_at: completedAt,
    });
    await updateApplication(env, job.application.id, { status: 'needs_info', updated_at: completedAt });
    await addEvent(env, job.application.id, job.application.user_id, 'browser_preflight_completed', {
      job_id: job.id,
      outcome: 'human_gate',
      gate: classification.gate,
      reason: classification.reason,
      inspection,
      submission_authorized: false,
    });
    return { id: job.id, status: 'human_gate', gate: classification.gate, inspection };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown browser-worker failure';
    const attempts = (job.attempt_count || 0) + 1;
    const retryAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await updateJob(env, job.id, {
      status: attempts >= 3 ? 'failed' : 'queued',
      last_error: message.slice(0, 600),
      next_attempt_at: retryAt,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
    });
    return { id: job.id, status: 'error', retrying: attempts < 3, error: message.slice(0, 180) };
  }
}

async function processQueue(env: Env): Promise<Record<string, unknown>> {
  const select = [
    'id,status,attempt_count',
    'application:grant_applications!grant_submission_jobs_application_id_fkey(',
    'id,user_id,status,',
    'grant:grant_opportunities!grant_applications_grant_id_fkey(slug,name,source_url,application_url)',
    ')',
  ].join('');
  const now = encodeURIComponent(new Date().toISOString());
  const response = await supabaseRequest(env, `grant_submission_jobs?status=eq.queued&next_attempt_at=lte.${now}&select=${encodeURIComponent(select)}&order=created_at.asc&limit=3`);
  if (!response.ok) throw new Error(`Queue fetch failed (${response.status}): ${(await response.text()).slice(0, 180)}`);
  const jobs = (await response.json()) as SubmissionJob[];
  const results: Record<string, unknown>[] = [];
  for (const job of jobs) results.push(await processJob(env, job));
  return { ok: true, claimed: jobs.length, results };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'shinnslist-grant-runner', engine: 'kitesurf_with_chromium_fallback', mode: 'inspection-only', submission_enabled: false });
    }
    if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);

    if (request.method === 'POST' && url.pathname === '/inspect') {
      try {
        const body = (await request.json()) as { url?: string };
        if (!body.url) return json({ error: 'url_required' }, 400);
        return json({ ok: true, inspection: await inspectWithKitesurf(env, body.url) });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'inspection_failed' }, 422);
      }
    }

    if (request.method === 'POST' && url.pathname === '/run') {
      try {
        return json(await processQueue(env));
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'queue_failed' }, 500);
      }
    }

    return json({ error: 'not_found' }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env, context: ExecutionContextLike): Promise<void> {
    context.waitUntil(processQueue(env));
  },
};
