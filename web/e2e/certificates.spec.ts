
import { test, expect } from '@playwright/test';

test.describe('Certificate Verification System', () => {

    test('Public Search and Verification Flow', async ({ page }) => {
        // 1. Visit Certificates Landing Page
        await page.goto('/certificates');

        // Verify Landing Page Elements
        await expect(page.locator('h1')).toContainText('Sertifika Doğrulama');
        await expect(page.locator('input[placeholder*="CERT-"]')).toBeVisible();

        // 2. Perform Valid Search
        // Using the known valid certificate ID from the database
        const validCertId = 'CERT-TEST-123';

        // Mock the certificate verification response
        await page.route(`**/rest/v1/certificates*credential_id=eq.${validCertId}*`, async route => {
            const json = {
                id: '123e4567-e89b-12d3-a456-426614174001',
                credential_id: validCertId,
                user_id: 'a7a49a27-6041-4cec-9943-f486b849b836',
                course_id: 'e8078132-31f5-4809-a54d-75a1231e1951',
                issued_at: new Date().toISOString(),
                courses: { title: 'Restored Test Course' },
                profiles: { full_name: 'Test Admin' }
            };
            await route.fulfill({ json });
        });

        await page.fill('input', validCertId);
        await page.click('button[type="submit"]');

        // 3. Verify Redirection and Success Page
        await expect(page).toHaveURL(`/certificates/${validCertId}`);

        // Check for success elements
        // Check for success elements
        // Use verify visible with specific name to avoid ambiguity with certificate design elements
        await expect(page.getByRole('heading', { name: 'Sertifika Doğrulandı' })).toBeVisible();
        await expect(page.getByText('ID: ' + validCertId).first()).toBeVisible();

        // 4. Verify "New Query" button works
        await page.click('text=Yeni Sorgulama', { force: true });
        await expect(page).toHaveURL('/certificates');
    });

    test('Invalid Certificate Handling', async ({ page }) => {
        const invalidCertId = 'CERT-INVALID-12345';

        // 1. Visit Invalid URL directly
        await page.goto(`/certificates/${invalidCertId}`);

        // 2. Verify Error State
        await expect(page.locator('h1')).toContainText('Doğrulama Başarısız');
        await expect(page.locator('text=Kimlik no hatalı')).toBeVisible();

        // 3. Navigate back
        await page.click('button:has-text("Sorgulamaya Dön")', { force: true });
        await expect(page).toHaveURL('/certificates');
    });

});
