import { test, expect } from '@playwright/test';

test.describe('LMS Core Simulation', () => {

    test('Login and Dashboard Flow', async ({ page }) => {
        page.on('dialog', async dialog => {
            console.log(`Alert message: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // 1. Visit Root (Login Page)
        await page.goto('/');

        // Verify Login Form
        await expect(page.locator('h1, h2, h3, span').filter({ hasText: /Giriş Yap|Login|IPSUM/ })).toBeVisible();

        // 2. Perform Login
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');

        // 3. Verify Redirect to Dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // 4. Verify Dashboard Elements
        // Sidebar
        const sidebar = page.locator('text=LMS Pro');
        await expect(sidebar).toBeVisible();

        // Dashboard Heading
        await expect(page.locator('h1')).toContainText("Dashboard'u"); // Başarı Dashboard'u

        // 5. Navigation Check
        // Click Courses
        await page.click('a[href="/courses"]');
        await expect(page).toHaveURL(/\/courses/);

        // Go back to Dashboard
        await page.click('a[href="/dashboard"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Course Details Flow', async ({ page }) => {
        // Login first
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // Go to Courses
        await page.click('a[href="/courses"]');

        // Check if any course exists
        const courseCards = page.locator('.group.relative'); // Assuming CourseCard has this class or similar
        const count = await courseCards.count();

        if (count > 0) {
            // Click first course
            await courseCards.first().click();
            await expect(page).toHaveURL(/\/courses\/.*/);
        } else {
            console.log('No courses found, skipping details check');
        }
    });

});
