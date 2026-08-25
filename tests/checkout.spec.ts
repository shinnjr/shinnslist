import { test, expect } from '@playwright/test';

test('pricing: grant desk and submission-credit pricing are explicit', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: /Pay for applications moving forward/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Grant Desk' })).toBeVisible();
  await expect(page.getByText('$29')).toBeVisible();
  await expect(page.getByText('per month')).toBeVisible();
  await expect(page.getByRole('link', { name: /Open my grant desk/ })).toHaveAttribute('href', '/signup');
  await expect(page.getByRole('heading', { name: 'Submission credits' })).toBeVisible();
  await expect(page.getByText(/Charged only when you approve/)).toBeVisible();
  await expect(page.getByText(/Legal attestations, signatures, paid fees/)).toBeVisible();
});
