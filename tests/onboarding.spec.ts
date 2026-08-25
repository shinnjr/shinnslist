import { test, expect } from '@playwright/test';

test('grant onboarding: profile facts persist and matching starts without crossing a submission gate', async ({ page }) => {
  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Who is applying?' })).toBeVisible();
  const applicantType = page.getByRole('button', { name: 'Small business' });
  await applicantType.click();
  await expect(applicantType).toHaveClass(/is-selected/);
  await page.getByLabel('Applicant name').fill('Shinnslist QA Applicant');
  await expect(page.getByLabel('Applicant name')).toHaveValue('Shinnslist QA Applicant');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Apply the hard eligibility rules.' })).toBeVisible();
  await expect(page.getByLabel('City')).toHaveValue('Denver');
  await expect(page.getByLabel('State')).toHaveValue('Colorado');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Give the drafting engine real material.' })).toBeVisible();
  await page.getByLabel('What do you do, who do you help, and why does it matter?').fill('We help Colorado applicants identify verified grants and prepare truthful, source-backed applications.');
  await page.getByLabel('What would grant funding pay for?').fill('Improve application verification, accessibility, and deadline operations.');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Ready to calculate your matches.' })).toBeVisible();
  await expect(page.getByText('No SSN, EIN, bank details, signature, or legal attestation has been collected.')).toBeVisible();
  await page.getByRole('button', { name: 'Calculate my matches' }).click();

  await page.waitForURL('**/grants?profile=complete', { timeout: 15000 });
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('shinnslist_grant_profile') || '{}'));
  expect(profile.businessName).toBe('Shinnslist QA Applicant');
  expect(profile.mission).toContain('truthful');
  expect(profile).not.toHaveProperty('ssn');
});
