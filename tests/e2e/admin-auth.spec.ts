import { test, expect } from '@playwright/test';

test('login page renders expected elements', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'TrustIP' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
