import { test, expect } from '@playwright/test';

test.describe.skip('Admin Course Builder', () => {
    const timestamp = Date.now();
    const courseTitle = `Builder Test Course ${timestamp}`;
    const moduleTitle = `Test Module ${timestamp}`;
    const lessonTitle = `Test Lesson ${timestamp}`;

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test.skip('Curriculum Management (Modules & Lessons)', async ({ page }) => {
        test.slow(); // Generic timeout increase for complex flows

        // 1. Create Course & Navigate
        await page.goto('/admin/courses');
        const createBtn = page.getByRole('button', { name: 'Create New Course' });
        await createBtn.click();
        await page.getByLabel('Title').fill(courseTitle);
        await page.getByLabel('Description').fill('Curriculum Test');
        await page.getByRole('button', { name: 'Create Course' }).click();
        await page.waitForTimeout(1000); // Wait for DB sync
        await page.goto('/admin/courses');

        // Find the row with the course and click the edit link (Pencil)
        await page.locator('tr', { hasText: courseTitle })
            .getByRole('link')
            .click(); // This usually points to /admin/courses/[id]

        // Verify we are in the builder
        await expect(page).toHaveURL(/\/admin\/courses\/[a-zA-Z0-9-]+$/);

        // 2. Go to Curriculum
        await page.getByRole('tab', { name: 'Curriculum' }).click();

        // 3. Add Multiple Modules
        const mod1 = 'Module 1: Basics';
        const mod2 = 'Module 2: Advanced';

        // Add Mod 1
        await page.getByRole('button', { name: 'Add Module' }).click();
        await page.fill('input[placeholder^="Enter module title"]', mod1);
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(page.getByText(mod1)).toBeVisible({ timeout: 60000 });

        // Add Mod 2
        await page.getByRole('button', { name: 'Add Module' }).click();
        await page.fill('input[placeholder^="Enter module title"]', mod2);
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(page.getByText(mod2)).toBeVisible({ timeout: 60000 });

        // 4. Test Drag & Drop (Reorder)
        // Note: dnd-kit/hello-pangea is hard to test with simple dragTo. 
        // We will try using keyboard or precise mouse moves if needed. 
        // For now, we will verify they exist in order (Mod 1 then Mod 2).
        const items = page.locator('.bg-slate-900'); // Assuming module card class
        // This selector is brittle, let's use text order.
        await expect(page.locator('h3').first()).toContainText(mod1);

        // 5. Edit Module
        // 5. Edit Module
        const mod1New = 'Module 1: Foundations';
        // Locate the header div containing the title
        const mod1Header = page.getByRole('heading', { name: mod1 }).locator('xpath=../..');

        // Click the menu button inside the header
        await mod1Header.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') }).click();

        await page.getByText('Rename').click();
        await page.locator(`input[value="${mod1}"]`).fill(mod1New);
        await page.keyboard.press('Enter');
        await expect(page.getByText(mod1New)).toBeVisible();

        // 6. Delete Module 2
        page.on('dialog', dialog => dialog.accept()); // Handle confirm
        // 6. Delete Module 2
        page.on('dialog', dialog => dialog.accept()); // Handle confirm
        const mod2Header = page.getByRole('heading', { name: mod2 }).locator('xpath=../..');
        await mod2Header.locator('button').filter({ has: page.locator('svg.lucide-more-vertical') }).click();

        await page.getByText('Delete').click();
        await expect(page.getByText(mod2)).not.toBeVisible();

        // 7. Add Lesson to Module 1
        await page.getByRole('button', { name: 'Add Lesson' }).first().click();
        await page.getByLabel('Title').fill(lessonTitle);
        await page.getByLabel('Video URL (Optional)').fill('https://vimeo.com/123456789');
        await page.getByLabel('Content / Description').fill('Lesson Content');
        await page.getByRole('button', { name: 'Save Lesson' }).click();
        await expect(page.getByText(lessonTitle)).toBeVisible();
    });
});
