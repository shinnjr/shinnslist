import { test, expect } from '@playwright/test';

/**
 * Checkout flow: visit pricing -> click the Pro CTA.
 * The Pro CTA (tier.href) targets /api/checkout?tier=pro.
 * NOTE: API routes are moved aside for the static export build, so /api/checkout
 * may 404 at runtime — we verify the CTA exists, points at the right checkout
 * URL, and triggers navigation to it.
 */
test('checkout: pricing page renders all CTAs', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: /\$5\/week/ })).toBeVisible();

  // Three tier CTAs present
  await expect(page.getByRole('link', { name: 'Start Free' })).toBeVisible();
  const goPro = page.getByRole('link', { name: 'Go Pro', exact: true });
  const goProFlipper = page.getByRole('link', { name: 'Go Pro Flipper', exact: true });
  await expect(goPro).toBeVisible();
  await expect(goProFlipper).toBeVisible();

  // CTAs target the checkout API with the right tier param
  await expect(goPro).toHaveAttribute('href', '/api/checkout?tier=pro');
  await expect(goProFlipper).toHaveAttribute('href', '/api/checkout?tier=pro-flipper');
  await expect(page.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/');
});

test('checkout: clicking Pro CTA navigates to checkout', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Go Pro', exact: true }).click();
  // Client navigates toward the checkout endpoint (may resolve to 404 if the
  // API worker isn't deployed — but the CTA must initiate the request).
  await page.waitForURL('**/api/checkout**', { timeout: 10000 });
  expect(page.url()).toContain('/api/checkout?tier=pro');
});
