import { test, expect } from '@playwright/test';

test.describe('Instructor Persona: Polar Integration', () => {
    // Instructor Credentials
    const EMAIL = 'kentrasul@outlook.com';
    const PASS = 'cni$9B16lzS!Y0zuvGN2@j2GHPO';

    // Polar Data
    const TOKEN = 'polar_oat_Q7CEIZJZaeZaREmoKcXp3cVjNxhpFW32CwROx3ALDG4';
    const ORG_ID = '3be40a8a-232e-4041-ba8d-d683f459bc9a';
    const LICENSE_KEY = '8C3697DA-96C1-4FE7-BC3C-D1187B7001C6';

    test('Step 1: Instructor Configures SaaS Integration', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', EMAIL);
        await page.fill('input[type="password"]', PASS);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

        // 2. Go to Settings
        await page.goto('/settings');
        await expect(page.locator('h1')).toContainText('Settings');

        // 3. Configure Polar
        await page.fill('#polar-token', TOKEN);
        await page.fill('#polar-org', ORG_ID);
        await page.click('button:has-text("Entegrasyonu Kaydet")');
        await expect(page.locator('text=Polar entegrasyonu kaydedildi')).toBeVisible();

        // 4. Verify Own License (Self-Verification)
        await page.fill('#license-key', LICENSE_KEY);
        await page.click('button:has-text("Doğrula")');

        // 5. Assert Success
        await expect(page.locator('text=Lisans anahtarı doğrulandı').or(page.locator('text=Lisansınız aktif'))).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Lisansınız aktif')).toBeVisible();
    });
});
