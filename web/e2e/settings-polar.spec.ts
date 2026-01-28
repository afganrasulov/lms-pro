import { test, expect } from '@playwright/test';

test.describe('Polar Settings - Mocked', () => {
    const USER_EMAIL = 'test_automation_user@example.com';
    const USER_PASS = 'TestPass123!';

    test.beforeEach(async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
            await emailInput.fill(USER_EMAIL);
            await page.fill('input[type="password"]', USER_PASS);
            await page.locator('button[type="submit"]').click();
            await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
        }
    });

    test('should save and then disconnect Polar credentials', async ({ page }) => {
        await page.goto('/settings');

        // Wait for page title to ensure navigation
        await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

        // Debug: Log all text if Polar header is not found
        try {
            await expect(page.locator('text=Polar Entegrasyonu')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            console.log("Current Page Text:", await page.locator('body').innerText());
            throw e;
        }

        // --- SAVE FLOW ---

        // Fill credentials
        const tokenInput = page.locator('input[id="polar-token"]');
        const orgInput = page.locator('input[id="polar-org"]');

        await tokenInput.fill('mock_polar_token_123');
        await orgInput.fill('mock_org_id_456');

        // Click Save
        await page.click('button:has-text("Entegrasyonu Kaydet")');

        // Verify Success Toast
        await expect(page.locator('text=Polar entegrasyonu kaydedildi!')).toBeVisible();

        // Verify "Disconnect" button appears
        const disconnectBtn = page.locator('button:has-text("Bağlantıyı Kes")');
        await expect(disconnectBtn).toBeVisible();

        // --- DISCONNECT FLOW ---

        // Handle Confirm Dialog
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Polar entegrasyonunu kaldırmak istediğinize emin misiniz?');
            await dialog.accept();
        });

        // Click Disconnect
        await disconnectBtn.click();

        // Verify Success Toast
        await expect(page.locator('text=Polar bağlantısı kesildi.')).toBeVisible();

        // Verify Inputs are cleared (or at least the state logic clears them)
        // Note: React state might need a refresh logic if we strictly want inputs cleared immediately.
        // In our implementation: setPolarSettings({ polar_access_token: '', ... }) is called.
        await expect(tokenInput).toHaveValue('');
        await expect(orgInput).toHaveValue('');

        // Verify Disconnect button is gone
        await expect(disconnectBtn).toBeHidden();
    });
});
