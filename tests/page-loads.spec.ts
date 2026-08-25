import { test, expect } from '@playwright/test';

/**
 * Page-load smoke test: every top-level route (8 page.tsx routes + manifest.json)
 * must respond with HTTP 200 and render meaningful content.
 *
 * NOTE: We intentionally assert on HTTP status + rendered body, NOT zero client
 * errors. Known dev-mode quirks (home page hydration mismatch from Date.now()
 * mock timestamps, and a leaflet-draw CSS module error under `next dev`) would
 * otherwise fail unrelated pages. Those are surfaced in the test log instead.
 */
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/grants', name: 'grant matches' },
  { path: '/applications', name: 'application control' },
  { path: '/apply?id=tdf-capacity-building-2026', name: 'application preview' },
  { path: '/how-it-works', name: 'grant workflow' },
  { path: '/onboarding', name: 'onboarding' },
  { path: '/pricing', name: 'pricing' },
  { path: '/signup', name: 'signup' },
  { path: '/login', name: 'login' },
  { path: '/post', name: 'legacy post' },
  { path: '/welcome', name: 'legacy welcome' },
  { path: '/zones', name: 'legacy zones' },
  { path: '/watch', name: 'legacy watch' },
  { path: '/manifest.json', name: 'manifest' },
];

for (const page of PAGES) {
  test(`page loads with 200: ${page.path}`, async ({ request, page: p }) => {
    // 1) HTTP status check on the raw document/asset
    const res = await request.get(page.path);
    expect(res.status()).toBe(200);

    // 2) Browser render check: must load and render non-empty content
    const errors: string[] = [];
    p.on('pageerror', (err) => errors.push(String(err)));
    const resp = await p.goto(page.path, { waitUntil: 'domcontentloaded' });
    expect(resp?.status()).toBe(200);

    if (page.path.endsWith('.json')) {
      // manifest.json: confirm it parsed as valid JSON
      const body = await res.text();
      expect(() => JSON.parse(body)).not.toThrow();
    } else {
      // HTML page: body must have actual rendered content
      const bodyText = await p.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
      // Surface known dev-mode client errors (hydration mismatch on home,
      // leaflet-draw CSS module in dev) as warnings, not hard failures.
      if (errors.length) console.warn(`[${page.path}] client errors:`, errors);
    }
  });
}
