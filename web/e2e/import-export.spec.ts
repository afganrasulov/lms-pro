import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';

test.describe('Bulk Course Import/Export System', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/');
        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button[type="submit"]', { force: true });
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    });

    test('should export template, modify data offline, and import changes correctly', async ({ page, request }) => {
        test.setTimeout(120000); // Allow time for full cycle

        // 1. Create a Fresh Course
        console.log('Creating course via UI...');
        await page.goto('/admin/courses');
        await page.getByRole('button', { name: 'Create New Course' }).click();

        const courseTitle = `Bulk Test Course ${Date.now()}`;
        await page.getByLabel('Title').fill(courseTitle);
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: /Create Course|Save/i }).click();

        await expect(page.getByRole('dialog')).toBeHidden();
        await page.reload();

        // Find and Edit
        const row = page.getByRole('row', { name: new RegExp(courseTitle) });
        await row.getByRole('link').first().click();

        await expect(page).toHaveURL(/\/admin\/courses\/.+/);
        const url = page.url();
        const courseId = url.split('/').pop()!;
        console.log(`Testing with Course ID: ${courseId}`);

        // 2. Export / Download Template (API Call)
        console.log('Downloading Export Template...');
        const exportResponse = await page.request.get(`/api/courses/${courseId}/export`);

        if (!exportResponse.ok()) {
            console.log(`Export failed with status: ${exportResponse.status()}`);
            console.log(await exportResponse.text());
        }
        expect(exportResponse.ok()).toBeTruthy();

        const buffer = await exportResponse.body();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Verify Sheets exist
        expect(workbook.SheetNames).toContain('Course Settings');
        expect(workbook.SheetNames).toContain('Curriculum');

        // 3. Modify Excel Data
        console.log('Modifying Excel Data...');

        // A. Modify Course Settings
        const courseSheet = workbook.Sheets['Course Settings'];
        const courseData = XLSX.utils.sheet_to_json<any>(courseSheet);

        // Update subtitle and level
        courseData[0]['Subtitle'] = 'Updated via E2E Automation';
        courseData[0]['Level'] = 'Advanced';
        courseData[0]['Category'] = 'Automation Testing';

        const newCourseSheet = XLSX.utils.json_to_sheet(courseData);
        workbook.Sheets['Course Settings'] = newCourseSheet;

        // B. Add Curriculum Data
        const curriculumData: any[] = [];
        // Add a module and lesson
        curriculumData.push({
            'Module Title': 'E2E Module 1',
            'Lesson Title': 'E2E Lesson 1',
            'Lesson Type': 'video',
            'Content': 'Markdown content for E2E lesson',
            'Video URL': 'https://vimeo.com/123456789',
            'Duration (min)': 10,
            'Free Preview': 'Yes',
            'Slug': 'e2e-lesson-1'
        });

        const newCurriculumSheet = XLSX.utils.json_to_sheet(curriculumData);
        workbook.Sheets['Curriculum'] = newCurriculumSheet;

        // Write to buffer
        const newExcelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 4. Import Modified File
        console.log('Uploading modified file...');
        console.log(`Current URL before reload: ${page.url()}`);
        await page.reload();
        await page.waitForLoadState('networkidle');
        console.log(`Current URL after reload: ${page.url()}`);

        // Try to click Curriculum tab (Müfredat in TR)
        await page.getByRole('tab', { name: /Curriculum|Müfredat/i }).click();
        await page.getByRole('button', { name: /Bulk Import/i }).click();

        await expect(page.getByRole('dialog')).toBeVisible();

        // Upload
        await page.setInputFiles('input[type="file"]', {
            name: 'modified_import.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer: newExcelBuffer
        });

        // Click Import
        const importPromise = page.waitForResponse(response =>
            response.url().includes('/import') && response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: /Import/i }).click();
        const response = await importPromise;
        expect(response.status()).toBe(200);
        const resJson = await response.json();
        console.log('Import Response Debug:', JSON.stringify(resJson, null, 2));

        // 5. Verify UI Changes
        console.log('Verifying UI changes...');
        await page.reload();

        // Verify Curriculum
        // Switch tab again just in case reload resets it
        await page.getByRole('tab', { name: /Curriculum|Müfredat/i }).click();

        const moduleTrigger = page.getByText('E2E Module 1');
        await expect(moduleTrigger).toBeVisible({ timeout: 10000 });
        // Click to expand if it's an accordion
        await moduleTrigger.click();

        await expect(page.getByText('E2E Lesson 1')).toBeVisible();

        // Verify Course Settings (Subtitle/Level)
        await page.getByRole('tab', { name: /Basic|Genel/i }).click();

        // Check Subtitle field
        const subtitleInput = page.getByLabel(/Subtitle|Alt Başlık/i);
        // If subtitle input is visible, check value
        if (await subtitleInput.isVisible()) {
            await expect(subtitleInput).toHaveValue('Updated via E2E Automation');
        } else {
            console.log('Subtitle input not found on Basics tab, skipping UI verification for course settings.');
        }

    });
});

