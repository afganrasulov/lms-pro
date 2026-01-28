
import { test, expect } from '@playwright/test';

test.describe('Real-time Lesson Sync', () => {
    // Shared variables
    const adminEmail = 'test_automation_user@example.com';
    const adminPass = 'TestPass123!';

    test('Admin updates lesson description and student sees transparency', async ({ browser }) => {
        test.setTimeout(90000); // Extended timeout

        // 1. Admin Context: Create Course & Lesson
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();

        // Login
        await adminPage.goto('/');
        await adminPage.fill('input[type="email"]', adminEmail);
        await adminPage.fill('input[type="password"]', adminPass);
        await adminPage.click('button[type="submit"]');
        await expect(adminPage).toHaveURL(/\/dashboard/);

        await adminPage.waitForLoadState('networkidle');

        // Nav to Courses
        await adminPage.goto('/admin/courses');
        await adminPage.waitForLoadState('networkidle');

        // Wait for Create Button
        // Wait for Create Button
        const createBtn = adminPage.locator('text=Yeni Kurs Oluştur').first();
        await expect(createBtn).toBeVisible({ timeout: 20000 });
        await createBtn.click();

        // Create Course
        const timestamp = Date.now();
        const testCourseTitle = `Sync Test Course ${timestamp}`;
        const testLessonTitle = `Sync Lesson ${timestamp}`;

        await adminPage.fill('#title', testCourseTitle);
        await adminPage.fill('#description', 'Test Description');

        // Click submit in dialog
        await adminPage.click('div[role="dialog"] button[type="submit"]');

        // Wait for list to update and show new course
        // The dialog closes and toast appears, list reloads
        await expect(adminPage.locator(`text=${testCourseTitle}`)).toBeVisible({ timeout: 20000 });

        // Find the Edit button for this course and click
        // Row contains title, we look for the edit link in that row
        const row = adminPage.locator(`tr:has-text("${testCourseTitle}")`);
        const editBtn = row.locator('a[href*="/admin/courses/"]').first();
        await editBtn.click();

        // NOW wait for redirect to builder
        await expect(adminPage.locator('h1')).toContainText(testCourseTitle, { timeout: 20000 });

        // Add Module
        await adminPage.click('button:has-text("Add Module")');
        await adminPage.fill('input[placeholder*="Enter module title"]', 'Module 1');
        await adminPage.click('button:has-text("Add")');

        // Wait for module to appear (Optimistic)
        await expect(adminPage.locator('text=Module 1')).toBeVisible();

        // Wait for persistence (Toast) to ensure we have real ID
        await expect(adminPage.locator('text=Module created')).toBeVisible({ timeout: 10000 });

        // Add Lesson
        // Click Add Lesson in the first module
        await adminPage.click('button:has-text("Add Lesson")');

        // Check if it's a dialog or inline
        // Assuming it's a dialog based on "Save Lesson" button expectation
        // Use ID if possible, or label
        const lessonTitleInput = adminPage.locator('input[id="title"], input[name="title"], input[placeholder="Lesson Title"]');
        await expect(lessonTitleInput.first()).toBeVisible();
        await lessonTitleInput.first().fill(testLessonTitle);

        // Explicitly fill slug
        await adminPage.fill('input[placeholder="lesson-slug"]', `slug-${timestamp}`);

        // Save initial lesson
        await adminPage.click('button:has-text("Save Lesson")');

        // Wait for dialog closure
        await expect(adminPage.locator('div[role="dialog"]')).not.toBeVisible();

        // Reload to ensure it's persisted and list updates
        await adminPage.reload();
        await expect(adminPage.locator(`text=${testLessonTitle}`)).toBeVisible({ timeout: 20000 });

        // Get Slug
        const slug = testCourseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // 2. Student Context
        const studentContext = await browser.newContext();
        const studentPage = await studentContext.newPage();

        // Login Student
        await studentPage.goto('/');
        await studentPage.fill('input[type="email"]', adminEmail);
        await studentPage.fill('input[type="password"]', adminPass);
        await studentPage.click('button[type="submit"]');
        await studentPage.waitForLoadState('networkidle');

        // Go to Learn Page
        await studentPage.goto(`/courses/${slug}/learn`);
        await expect(studentPage.locator('h1')).toContainText(testLessonTitle, { timeout: 15000 });

        // 3. Trigger Update in Admin
        // Find the lesson item and click the Edit button (Pencil)
        // Buttons are hidden until hover, so we force click or hover first
        const lessonItem = adminPage.locator('div[class*="group flex items-center justify-between"]').filter({ hasText: testLessonTitle });
        await lessonItem.hover(); // Reveal buttons
        await lessonItem.locator('button').first().click(); // First button is Edit (Pencil)
        const newDescription = `Updated Content ${Date.now()}`;

        // Ensure textarea is ready (sometimes inside dialog)
        const descInput = adminPage.locator('textarea[placeholder*="# Lesson Content"]');
        await expect(descInput).toBeVisible();
        await descInput.fill(newDescription);

        await adminPage.click('button:has-text("Save Lesson")');
        // Wait for save confirmation toast or request
        await expect(adminPage.locator('text=Lesson updated')).toBeVisible({ timeout: 10000 }).catch(() => { }); // Optional catch

        // 4. Verify Update in Student
        await expect(studentPage.locator('text=' + newDescription)).toBeVisible({ timeout: 15000 });
    });
});
