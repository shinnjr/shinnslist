import { test, expect } from '@playwright/test';

const qaProfile = {
  applicantType: 'small_business',
  businessName: 'Shinnslist QA Applicant',
  publicName: 'Shinnslist QA',
  city: 'Denver',
  state: 'Colorado',
  yearsOperating: '2-3',
  employees: '1',
  revenueRange: 'pre_revenue',
  ownershipIdentities: [],
  mission: 'We prepare truthful, source-backed grant applications for Colorado applicants.',
  fundingUse: 'Improve grant verification, accessibility, and deadline operations.',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((profile) => {
    localStorage.setItem('shinnslist_grant_profile', JSON.stringify(profile));
  }, qaProfile);
});

test('matching -> profile-backed draft preview preserves all final submission gates', async ({ page }) => {
  await page.goto('/grants', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Verified grant matches' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(8);

  const firstPreview = page.getByRole('link', { name: 'Preview application' }).first();
  const href = await firstPreview.getAttribute('href');
  expect(href).toMatch(/^\/apply\?id=/);
  await firstPreview.click();
  await expect(page).toHaveURL(new RegExp((href || '').replace('?', '\\?')));

  await expect(page.getByRole('heading', { name: 'Draft answers' })).toBeVisible();
  await expect(page.getByLabel('Tell us about the organization or business.')).toHaveValue(/truthful, source-backed/);
  await expect(page.getByLabel('How will the funding be used?')).toHaveValue(/verification, accessibility/);
  await expect(page.getByText('Final external submission')).toBeVisible();
  await expect(page.getByText('Separate approval')).toBeVisible();
  await expect(page.getByText(/Inspection approval never authorizes submission/)).toBeVisible();
});

test('desktop hides the mobile dock; mobile shows it without hiding the main CTA', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find grants I can win' })).toBeVisible();
});
