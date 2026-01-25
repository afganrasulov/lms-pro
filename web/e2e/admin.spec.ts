import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Navigate to Admin Dashboard and Verify Pages', async ({ page }) => {
        // 1. Visit Admin Dashboard directly
        await page.goto('/admin/dashboard');
        await expect(page.locator('h1')).toContainText('Admin Dashboard');

        // Check for Stats Cards
        await expect(page.locator('text=Total Users')).toBeVisible();
        await expect(page.locator('text=Total Courses')).toBeVisible();

        // 2. Navigate to Manage Courses
        await page.click('text=Manage Courses');
        await expect(page).toHaveURL(/\/admin\/courses/);
        await expect(page.locator('h1')).toContainText('Manage Courses');
        await expect(page.locator('text=Create New Course')).toBeVisible();

        // 3. Test Create Course Modal Open
        await page.click('text=Create New Course');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();
        await expect(page.locator('div[role="dialog"]').locator('text=Create New Course')).toBeVisible();
        // Close modal
        await page.keyboard.press('Escape');

        // 4. Navigate to Users
        await page.goto('/admin/users');
        await expect(page.locator('text=User Management')).toBeVisible();
        await expect(page.locator('input[placeholder="Search users..."]')).toBeVisible();

        // 5. Navigate to Settings
        await page.goto('/admin/settings');
        await expect(page.locator('text=System Settings')).toBeVisible();
        await expect(page.locator('text=Maintenance Mode')).toBeVisible();

        // 6. Navigate to Logs
        await page.goto('/admin/logs');
        await expect(page.locator('text=System Logs')).toBeVisible();
        await expect(page.locator('text=Activity Stream')).toBeVisible();
    });

});
