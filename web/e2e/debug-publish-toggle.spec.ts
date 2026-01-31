import { test, expect } from '@playwright/test';

test.describe('Debug Publish Toggle', () => {

    test('Create Course and Toggle Publish Status', async ({ page }) => {
        // 1. Login
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // 2. Go to Admin Course Edit Page Directly (Using Pre-created Course)
        const courseId = '550e8400-e29b-41d4-a716-446655440000';
        await page.goto(`/admin/courses/${courseId}`);

        // 4. Capture Console Logs
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(msg.text());
                console.log(`[Browser Error]: ${msg.text()}`);
            }
        });

        // 5. Toggle Publish
        // Look for the "Draft" badge which is clickable to toggle.
        // It should be visible if the course exists and is in draft mode.
        await expect(page.locator('text=Draft')).toBeVisible();
        await page.click('text=Draft');

        // 6. Verification
        // Expect success toast or error
        try {
            await expect(page.locator('text=Course published')).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('Publish Failed! See browser errors above.');
            throw e;
        }
    });
});
