// Tiny HTTP helpers shared by Pages Functions.

export interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
  params?: Record<string, string | string[]>;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function paramId(context: PagesContext, key = 'id'): string | null {
  const raw = context.params?.[key];
  if (typeof raw === 'string' && raw) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return null;
}
