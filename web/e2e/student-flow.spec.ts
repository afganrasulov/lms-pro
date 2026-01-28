import { test, expect } from '@playwright/test';

test.describe('Student Persona: License Activation', () => {
    // Student Credentials (will use signup or existing)
    // For simplicity, let's assume we can signup a new user or use a pre-existing one.
    // User provided: 07703605-1BB7-4863-B9A0-C23EE0E5D44B (License Key 2)
    const STUDENT_EMAIL = `student_${Date.now()}@test.com`;
    const STUDENT_PASS = 'StudentPass123!';
    const LICENSE_KEY = '07703605-1BB7-4863-B9A0-C23EE0E5D44B';

    test('Step 1: Student Signs Up and Activates License', async ({ page }) => {
        // 1. Signup
        await page.goto('/signup'); // Assuming /signup exists, or logic to signup
        // Fallback: if no public signup, use a known student account provided by user?
        // User didn't provide student credentials, only Instructor.
        // So I must Create one.

        // Check if /signup exists by navigating
        const resp = await page.goto('/login');
        await page.click('text=Kayıt Ol'); // Try to find signup link

        await page.fill('input[type="email"]', STUDENT_EMAIL);
        await page.fill('input[type="password"]', STUDENT_PASS);
        await page.click('button[type="submit"]');

        // Wait for dashboard or redirection
        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

        // 2. Go to Settings (to enter license)
        await page.goto('/settings');

        // 3. Enter License
        await page.fill('#license-key', LICENSE_KEY);
        await page.click('button:has-text("Doğrula")');

        // 4. Verify Success
        await expect(page.locator('text=Lisans anahtarı doğrulandı').or(page.locator('text=Lisansınız aktif'))).toBeVisible({ timeout: 20000 });
    });
});
