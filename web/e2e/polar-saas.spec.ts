import { test, expect } from '@playwright/test';

test.describe('Polar SaaS Integration (BYOK)', () => {
    // Credentials from admin.spec.ts logic
    const USER_EMAIL = 'test_automation_user@example.com';
    const USER_PASS = 'TestPass123!';

    // Data provided by user
    const POLAR_ORG_ID = '3be40a8a-232e-4041-ba8d-d683f459bc9a';
    const POLAR_TOKEN = 'polar_oat_1UNnVaSZfgAulvOxOSdLQY9MNvEL695wn3oNV1HEBsA';

    test.beforeEach(async ({ page }) => {
        // 1. Login
        await page.goto('/login'); // Assuming /login is the route, admin.spec.ts used /

        // Check if we are already redirected to dashboard (if session persists, though unlikely in new context)
        if (await page.url().includes('dashboard')) return;

        // Fill login form if strictly on login page or home with login form
        // admin.spec.ts goes to '/' and fills inputs.
        // Let's try to be robust.
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
            await emailInput.fill(USER_EMAIL);
            await page.fill('input[type="password"]', USER_PASS);
            await page.locator('button[type="submit"]').click({ force: true });
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
        }
    });

    test('Instructor can save Polar API keys', async ({ page }) => {
        // 2. Navigate to Settings
        await page.goto('/settings');
        await expect(page.locator('h1')).toContainText('Settings');

        // 3. Locate Polar Integration Section
        // Look for the header we added
        await expect(page.locator('text=Polar Entegrasyonu (SaaS)')).toBeVisible();

        // 4. Fill in API Keys
        const tokenInput = page.locator('input[id="polar-token"]');
        const orgInput = page.locator('input[id="polar-org"]');

        await tokenInput.fill(POLAR_TOKEN);
        await orgInput.fill(POLAR_ORG_ID);

        // 5. Save
        await page.click('button:has-text("Entegrasyonu Kaydet")');

        // 6. Verify Success Toast or Message
        // The code uses `toast.success('Polar entegrasyonu kaydedildi!')`
        await expect(page.locator('text=Polar entegrasyonu kaydedildi!')).toBeVisible({ timeout: 5000 });

        // 7. Scenario: Verify License Key (Full Cycle)
        // Now that the org is configured, we test if a license key valid for this org is accepted.
        const LICENSE_KEY = '8C3697DA-96C1-4FE7-BC3C-D1187B7001C6';

        const licenseInput = page.locator('input[id="license-key"]');
        await licenseInput.fill(LICENSE_KEY);
        await expect(licenseInput).toHaveValue(LICENSE_KEY);

        // Force click ensuring it's visible and enabled
        const verifyBtn = page.locator('button:has-text("Doğrula")');
        await expect(verifyBtn).toBeEnabled();
        await verifyBtn.click();

        // Wait for ANY outcome
        const successParams = page.locator('text=Lisans anahtarı doğrulandı');
        const failParams = page.locator('text=Doğrulama başarısız');
        const errorParams = page.locator('text=Internal system error');

        await expect(successParams.or(failParams).or(errorParams)).toBeVisible({ timeout: 20000 });

        // Log what we found
        if (await failParams.isVisible()) {
            console.log('TEST RESULT: Validation Failed (Expected if logic is wrong)');
            const text = await failParams.textContent(); // might capture toast text
            console.log('FAILURE TEXT:', text);
        } else if (await errorParams.isVisible()) {
            console.log('TEST RESULT: Internal System Error (Likely Env Var missing)');
            const text = await page.locator('li[data-sonner-toast]').allTextContents(); // grab all toasts to find error
            console.log('ERROR TEXT:', text);
        } else {
            console.log('TEST RESULT: Success!');
        }

        // Final assertion
        await expect(successParams).toBeVisible();

        // Check status change
        await expect(page.locator('text=Lisansınız aktif')).toBeVisible();

        // Optional: reload and verify persistence
        await page.reload();
        await expect(tokenInput).toHaveValue(POLAR_TOKEN);
        await expect(page.locator('text=Lisansınız aktif')).toBeVisible();
    });
});
