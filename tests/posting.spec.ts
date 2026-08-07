import { test, expect } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Posting flow: upload photo -> fill title/price -> submit -> success screen.
 * The post handler only requires `photo` and `title` (price optional).
 */
test('posting: upload photo, fill form, submit -> Posted!', async ({ page }) => {
  // Create a tiny valid PNG fixture for the file input
  // 1x1 red PNG
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const dir = mkdtempSync(join(tmpdir(), 'shinnslist-'));
  const photoPath = join(dir, 'fixture.png');
  writeFileSync(photoPath, Buffer.from(pngBase64, 'base64'));

  await page.goto('/post', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: /Post a deal/ })).toBeVisible();

  // Upload photo via the hidden file input
  await page.locator('input[type="file"]').setInputFiles(photoPath);
  // Preview image appears
  await expect(page.locator('img[alt="Preview"]')).toBeVisible();

  // Fill title + price
  await page.getByPlaceholder('What are you selling?').fill('E2E Test Chair');
  await page.getByPlaceholder('Price (optional)').fill('49');

  // Submit
  await page.getByRole('button', { name: /Post to Marketplace/ }).click();

  // Success state (simulated 1.5s delay, then "Posted!")
  await expect(page.getByRole('heading', { name: 'Posted!' })).toBeVisible({ timeout: 15000 });
});
