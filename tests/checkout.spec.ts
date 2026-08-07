import { test, expect } from '@playwright/test';

/**
 * Checkout flow: visit pricing -> click the Pro CTA.
 *
 * Current pricing page is a client component: the paid-tier CTAs are <button>s
 * that POST {tier, addons} to /api/checkout and, on success, redirect to the
 * returned Stripe Checkout url. /api/checkout is a Cloudflare Worker API route
 * that isn't running under `next dev`, so we mock it via page.route to make the
 * test deterministic and assert the flow the button drives.
 */
test('checkout: pricing page renders Free link + paid-tier buttons', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: /\$5\/week/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('button', { name: 'Go Pro', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go Pro Flipper', exact: true })).toBeVisible();
});

test('checkout: clicking Pro CTA POSTs to checkout and redirects to Stripe', async ({ page }) => {
  // Mock the /api/checkout endpoint (Cloudflare Worker, not in dev)
  let postedBody: unknown = null;
  await page.route('**/api/checkout', async (route) => {
    const body = route.request().postDataJSON();
    postedBody = body;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://checkout.stripe.com/test-session' }),
    });
  });

  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Go Pro', exact: true }).click();

  // Client redirected to the Stripe checkout URL returned by the mock
  await page.waitForURL('**/checkout.stripe.com/test-session**', { timeout: 10000 });

  // The CTA sent the correct payload
  expect(postedBody).toEqual({ tier: 'pro', addons: [] });
});
