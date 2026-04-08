import { test, expect } from '@playwright/test';

test('page loads and shows typing interface', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/aether|evo|typing/i);
});

test('user can start a typing session', async ({ page }) => {
  await page.goto('/');
  // Look for a start button or prompt text area
  const startBtn = page.getByRole('button', { name: /start|begin|play/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }
  // Typing area should be visible/focused
  const textarea = page.locator('textarea, [contenteditable]').first();
  await expect(textarea).toBeVisible();
});
