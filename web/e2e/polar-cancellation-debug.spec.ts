
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test('debug polar cancellation sync', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByPlaceholder('E-posta Adresi').fill('serkhanrasullu@gmail.com');
    await page.getByPlaceholder('Şifre').fill('cni$9B16lzS!Y0zuvGN2@j2GHPO'); // Using provided credentials
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    // Wait for dashboard or redirection
    await page.waitForURL('**/dashboard');

    // Navigate to Settings where the license status is shown
    await page.goto('/settings');

    // Check initial license status (Should be active per user report)
    // Assuming there is some UI indicator. 
    // User said: "Lisansınız aktif. Tüm kurslara erişebilirsiniz."
    // Look for text "Lisansınız aktif" or similar.
    await expect(page.getByText('Lisansınız aktif')).toBeVisible();

    console.log('User is logged in and License is Active. Triggering Cancellation...');

    // 2. Trigger Webhook Simulation
    // We can call the script I created earlier
    try {
        execSync('npx tsx scripts/simulate-polar-cancellation.ts', { cwd: process.cwd() });
        console.log('Webhook simulation executed.');
    } catch (e) {
        console.error('Webhook simulation failed', e);
        throw e;
    }

    // 3. Verify Update
    // We might need to reload the page or wait for a revalidation interval if it's polling
    // Use reload for now to be sure
    await page.reload();

    // Expect status to change
    // "Lisansınız pasif" or similar? Or just NOT "Lisansınız aktif"
    // Let's assert it becomes inactive.
    // Warning: If this test FAILS, it confirms the bug.
    await expect(page.getByText('Lisansınız aktif')).not.toBeVisible();
});
