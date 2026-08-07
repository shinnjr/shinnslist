import { test, expect } from '@playwright/test';

/**
 * Onboarding flow: pick categories -> pick interests -> email signup.
 * Ends by redirecting to /welcome (per onboarding/page.tsx handleSignup).
 */
test('onboarding: categories -> interests -> email -> welcome', async ({ page }) => {
  await page.goto('/onboarding', { waitUntil: 'networkidle' });

  // Step 1: pick-categories
  await expect(page.getByRole('heading', { name: /What brings you here\?/ })).toBeVisible();
  // Grouping cards = buttons inside the grid (each has an emoji + label), before the Continue button
  const groupingCards = page.locator('main .grid button');
  await groupingCards.nth(0).click();
  await groupingCards.nth(1).click();

  const continueBtn = page.getByRole('button', { name: /Continue \(2 selected\)/ });
  await expect(continueBtn).toBeEnabled();
  await continueBtn.click();

  // Step 2: pick-interests (need >= 3 selected to enable continue)
  await expect(page.getByRole('heading', { name: /Pick your interests/ })).toBeVisible();
  const cardButtons = page.locator('main .grid button');
  // click first 3 interest cards
  await cardButtons.nth(0).click();
  await cardButtons.nth(1).click();
  await cardButtons.nth(2).click();

  const continueInterests = page.getByRole('button', { name: /Continue \(3 selected\)/ });
  await expect(continueInterests).toBeEnabled();
  await continueInterests.click();

  // Step 3: email-signup
  await expect(page.getByRole('heading', { name: /You're all set!/ })).toBeVisible();
  await page.getByPlaceholder('you@email.com').fill('e2e+test@shinnslist.com');
  await page.getByRole('button', { name: /Start finding deals/ }).click();

  // Redirects to /welcome
  await page.waitForURL('**/welcome', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /Welcome to Shinnslist!/ })).toBeVisible();
});
