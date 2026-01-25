import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

test.describe('Global Course Import System', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create a new course from Excel template', async ({ page }) => {
        // 1. Generate a valid import file
        const timestamp = Date.now();
        const testCourseTitle = `Auto Global Import Course ${timestamp}`;
        const testCourseSlug = `auto-global-${timestamp}`;

        const workbook = XLSX.utils.book_new();

        // Sheet 1: Course Settings
        const courseData = [{
            'Title': testCourseTitle,
            'Slug': testCourseSlug,
            'Subtitle': 'Generated via E2E Test',
            'Description': 'This is a test course created globally.',
            'Status': 'published',
            'Visibility': 'public',
            'Level': 'Intermediate',
            'Status': 'draft',
            'Visibility': 'private',
            'Level': 'Beginner',
            'Category': 'Testing'
        }];
        const courseSheet = XLSX.utils.json_to_sheet(courseData);
        XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Settings');

        // Sheet 2: Curriculum
        const curriculumData = [
            {
                'Module Title': 'Test Module 1',
                'Lesson Title': 'Test Lesson 1',
                'Lesson Type': 'video',
                'Content': 'Content 1',
                'Video URL': 'https://test.com/1',
                'Duration (min)': 10,
                'Free Preview': 'Yes'
            },
            {
                'Module Title': '', // Simulate "Fill Down" / Merged Cell
                'Lesson Title': 'Test Lesson 2 (Implied Module)',
                'Lesson Type': 'text',
                'Content': 'Content 2',
                'Video URL': '',
                'Duration (min)': 5,
                'Free Preview': 'No',
                'Slug': 'global-lesson-2'
            }
        ];
        const curriculumSheet = XLSX.utils.json_to_sheet(curriculumData);
        XLSX.utils.book_append_sheet(workbook, curriculumSheet, 'Curriculum');

        const filePath = path.join(__dirname, `global_import_${timestamp}.xlsx`);
        XLSX.writeFile(workbook, filePath);

        // 2. Go to Courses Page
        await page.goto('/admin/courses');

        // 3. Open Import Modal
        // "Import New Course" or "Bulk Import/Export" depending on context, handled by the new logic
        // But in Courses Page it should say "Import New Course" because courseId is missing.
        await page.getByRole('button', { name: /Import New Course/i }).click();

        // 4. Check Template Download (Mock check)
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: /Download Blank Template/i }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('course_import_template.xlsx');

        // 5. Upload File
        // Direct setInputFiles avoids the need to wait for filechooser event
        // The input is hidden or handled by a button trigger in many UI libraries, 
        // but typically input[type="file"] is present.
        // If hidden, we might need to click the label or trigger.
        // In ShadCN Dialog, usually there's an input.
        // Let's assume there's a visible or invisible input we can dispatch to.
        // Or click "Choose File" if it exists.
        await page.locator('input[type="file"]').setInputFiles(filePath);

        // Wait for state update
        await page.waitForTimeout(1000);

        // 6. Click Import
        const importBtn = page.getByRole('button', { name: /Import Course Data/i });
        await expect(importBtn).toBeEnabled();
        await importBtn.click();

        // Monitor specific request
        const response = await page.waitForResponse(response => response.url().includes('/api/courses/import') && response.request().method() === 'POST');
        const responseBody = await response.json();
        console.log('Import Response Debug:', JSON.stringify(responseBody, null, 2));

        if (response.status() !== 200) {
            console.log('Response Error Body:', await response.text());
        }

        // Verify success message
        await expect(page.getByText('Course created successfully')).toBeVisible({ timeout: 25000 });

        // VERIFY CONTENT PERSISTENCE
        // Reload page to ensure list updates
        await page.reload();

        // Click on the new course to enter "Edit" mode
        // The course title is 'My New Course Title' from the template mock in api/courses/template/route.ts 
        // OR 'Test Course' if we are matching the file we generated.
        // In the test we generated a file with:
        // const courseTitle = 'Test Course Global Import'; // This line is not needed, use testCourseTitle

        // Locate the course row and click the edit button (Pencil icon link)
        const courseRow = page.getByRole('row').filter({ hasText: testCourseTitle });
        await expect(courseRow).toBeVisible();
        await courseRow.locator('a').first().click();

        // Wait for page load and verify title
        await expect(page.getByRole('heading', { level: 1, name: testCourseTitle })).toBeVisible({ timeout: 15000 });

        // Navigate to Curriculum Tab
        await page.getByRole('tab', { name: /Curriculum/i }).click();

        // Verify Modules and Lessons exist
        await expect(page.getByText('Test Module 1')).toBeVisible();
        await expect(page.getByText('Test Lesson 1')).toBeVisible();

        // Verify Fill-Down Logic worked
        // The second lesson had empty module title, should be in 'Test Module 1' visually (or at least exist)
        // Since UI might group them, we just check existence for now.
        // Assuming "Test Lesson 2 (Implied Module)" is visible or inside a collapsed accordion.
        // Ideally we should see it.
        await expect(page.getByText('Test Lesson 2 (Implied Module)')).toBeVisible();

        // 7. Verify Course Appears (This step is now integrated into the content persistence verification)
        // It says it triggers router.refresh() and loadCourses().
        // So we should see it in the table.
        // await expect(page.getByText(testCourseTitle)).toBeVisible(); // This check is done above before clicking the course

        // Cleanup
        fs.unlinkSync(filePath);

        // Optional: Delete the course via API or UI to clean up DB
    });
});
